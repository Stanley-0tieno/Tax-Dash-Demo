# TaxDash v1.0 — AI-Powered Tax Risk Analyzer

> An end-to-end tax compliance risk platform for Kenyan SMEs.  
> Upload financial documents → AI extracts the data → ML model scores your tax risk.

**Onyango Stanley Otieno**

---

## The Problem

KRA uses financial ratio analysis to identify companies at risk of
tax non-compliance and select them for audit. Companies never see
that analysis — they only find out when the audit letter arrives.

**TaxDash runs the same logic on behalf of the company, before KRA does.**

---

## How It Works — End to End

```
Company uploads PDF documents (balance sheet, invoice, payroll)
            ↓
  PyMuPDF extracts raw text from the PDF locally
            ↓
  Gemini AI reads the text and returns structured financial JSON
            ↓
  FastAPI risk engine receives the JSON
            ↓
  Computes 12 financial ratios from the raw figures
            ↓
  Passes ratios through trained RandomForest classifier
            ↓
  Returns: risk level + confidence scores + flags + recommendations
            ↓
  Angular frontend displays the result and generates a compliance report
```

---

## Architecture

The system is built on a **microservices architecture** with four
independently running services communicating via REST APIs and WebSocket.

```
┌─────────────────────────────────────────────────────┐
│               Angular Frontend (4200)                │
│   Dashboard · Upload · Risk Analysis · Reports       │
│   Chatbot · Admin Chat · Company Profile             │
└──────────┬──────────┬──────────────┬────────────────┘
           │          │              │
           ▼          ▼              ▼
  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
  │ Spring Boot │  │   FastAPI    │  │     FastAPI      │
  │  Auth (8084)│  │ Doc Scanner  │  │  Risk Engine     │
  │             │  │   (8000)     │  │    (8001)        │
  │ JWT · bcrypt│  │              │  │                  │
  │ RBAC        │  │ PyMuPDF      │  │ ML Model         │
  │ RabbitMQ    │  │ Gemini AI    │  │ Ratio Compute    │
  │ Email verify│  │ WebSocket    │  │ Report Generate  │
  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘
         │                │                    │
         └────────────────┴────────────────────┘
                          │
                  ┌───────▼────────┐
                  │   PostgreSQL   │
                  │   (port 5432)  │
                  └────────────────┘
```

---

## Services

### 1. Authentication Service — Spring Boot (port 8084)

**Folder:** `/auth`

Handles company registration, login, and session management.

| Feature | Detail |
|---|---|
| Framework | Spring Boot 3.5 + Spring Security |
| Language | Java 21 |
| Authentication | JWT (HMAC-SHA256 signed tokens) |
| Password storage | bcrypt (cost factor 12) — never plain text |
| Email verification | RabbitMQ async queue → SMTP delivery |
| Token storage | In-memory on frontend (not localStorage — XSS protection) |

**Registration requires:** email, company name, KRA PIN, password  
**KRA PIN is validated** against the required format before the record is created.

---

### 2. Document Scanner Service — FastAPI (port 8000)

**Folder:** `/Doc-scanner`

Handles PDF upload, AI-powered financial data extraction,
and real-time WebSocket status updates.

#### Extraction Pipeline

```
User uploads PDF
      ↓
Validate: PDF format? Size ≤ 10MB?
      ↓
Store raw file bytes in PostgreSQL (status = pending)
      ↓
WebSocket broadcasts: status → pending (real-time, no polling)
      ↓
Background task starts (asyncio, 120s timeout)
      ↓
PyMuPDF extracts raw text from PDF locally (no API cost)
      ↓
Gemini AI API receives text + structured prompt
      ↓
Gemini returns financial JSON:
{
  "document_type": "balance_sheet",
  "company_name": "Dama's Tech Ltd",
  "total_assets": 5000000,
  "total_liabilities": 3200000,
  "revenue": 2000000,
  "net_profit": 150000,
  ...18 financial fields
}
      ↓
JSON stored in PostgreSQL (status = completed)
      ↓
WebSocket broadcasts: status → completed (real-time)
```

#### Key Technical Decisions

**PyMuPDF first, Gemini second** — text extraction happens locally using
PyMuPDF at zero cost. Only the extracted text (not the PDF) is sent to
Gemini. This minimizes API usage and cost while keeping extraction accurate.

**WebSocket over polling** — file processing can take up to 120 seconds.
Instead of the frontend asking the server "are you done yet?" every few
seconds, the backend pushes updates as they happen via a persistent
WebSocket connection. The `ConnectionManager` class broadcasts progress
percentages (10% → 30% → 80% → 100%) to all connected clients.

**Background tasks** — `POST /api/analyze-all` returns immediately and
processes files asynchronously using FastAPI's `BackgroundTasks`. The user
is not blocked waiting for Gemini.

| Technology | Purpose |
|---|---|
| FastAPI | Async REST API and WebSocket server |
| PyMuPDF (fitz) | Local PDF text extraction |
| Gemini AI (google-genai) | Structured financial data extraction from text |
| PostgreSQL (SQLAlchemy) | File storage and extracted data persistence |
| pytesseract + Pillow | OCR fallback for scanned/image PDFs |

---

### 3. Risk Analysis Engine — FastAPI (port 8001)

**Folder:** `/Doc-scanner/risk-engine`

Hosts the trained ML model and serves risk predictions,
flag generation, and compliance report generation.

#### What Happens When Financial JSON Arrives

```python
# 1. Compute 12 financial ratios from raw figures
ratios = compute_ratios(financial_data)
# e.g. debt_ratio = total_liabilities / total_assets

# 2. Build DataFrame and handle missing values
df = pd.DataFrame([ratios])[model_features]
imputed = imputer.transform(df)   # fills nulls with training medians

# 3. Run RandomForest prediction
risk_level     = model.predict(imputed)[0]          # "High" / "Medium" / "Low"
probabilities  = model.predict_proba(imputed)[0]    # [0.34, 0.52, 0.14]

# 4. Generate human-readable risk flags
flags = generate_risk_flags(ratios)
# e.g. "High debt ratio — liabilities exceed 70% of assets"

# 5. Return full result
return {
    "risk_level":     "Medium",
    "confidence":     {"High": 34.0, "Medium": 52.0, "Low": 14.0},
    "risk_flags":     [...],
    "ratios":         {...},
    "recommendation": "Schedule routine compliance check"
}
```

---

## The Machine Learning Model

### Problem Framing

This is a **multi-class classification** problem.  
Input: 12 financial ratios computed from a company's documents.  
Output: one of three classes — `High`, `Medium`, or `Low` tax compliance risk.

### Algorithm: RandomForest Classifier (scikit-learn)

RandomForest was chosen over alternatives for three reasons:

**1. Performance on tabular data** — Research consistently shows ensemble
methods outperform neural networks on structured tabular financial datasets
of this size. My results confirmed this: RandomForest achieved 98%,
logistic regression baseline achieved 91%.

**2. Interpretability** — Feature importance scores let me explain which
ratios drove the risk score. For a compliance tool, users need to know
*why* they got the score they got — not just a number.

**3. Deployment simplicity** — Saved as a `.pkl` file, loaded into memory
at startup, serves predictions in milliseconds with no GPU required.

### Training Dataset

**Source:** Polish Company Bankruptcy Prediction (Kaggle)  
**Link:** https://www.kaggle.com/datasets/fedesoriano/company-bankruptcy-prediction  
**Records used:** 25,118 companies (25,121 raw, 3 dropped in cleaning)

**Why a proxy dataset?**  
KRA company tax data is protected under the **Kenya Data Protection Act
(2019)** — revenue authorities cannot legally release company-level
financial records to researchers. The Polish dataset was used because
financial stress ratios are universal across economies. Risk labels were
engineered using KRA-documented audit trigger indicators rather than
taken directly from the source dataset.

### Label Engineering

Risk labels were computed using a custom scoring function rather than
using the dataset's bankruptcy column directly:

```python
def compute_tax_risk(row):
    score = 0

    # High debt relative to assets
    if row['total_liabilities_over_total_assets'] > 0.6:    score += 25

    # Low or negative profit margin
    if row['net_profit_over_sales'] < 0:                    score += 25
    elif row['net_profit_over_sales'] < 0.05:               score += 10

    # Low operating efficiency
    if row['profit_on_operating_activities_...'] < 0.02:    score += 20

    # Poor liquidity
    if row['current_assets_over_short_term_liabilities'] < 1.0: score += 15

    # Already flagged as bankrupt in dataset
    if row['class'] == 1:                                   score += 15

    return min(score, 100)

# Label mapping
# score 0–30  → Low
# score 31–60 → Medium
# score 61–100 → High
```

**Label distribution:**

| Class | Count | Percentage |
|---|---|---|
| Low | 15,088 | 60% |
| Medium | 6,853 | 27% |
| High | 3,177 | 13% |

`class_weight='balanced'` was used in training to handle the class
imbalance and prevent the model from defaulting to the majority class.

### Features (12 Financial Ratios)

| Feature | Tax Compliance Relevance |
|---|---|
| net_profit_over_total_assets | Income tax on profits |
| total_liabilities_over_total_assets | Debt-based tax avoidance |
| working_capital_over_total_assets | Predicts remittance failure |
| current_assets_over_short_term_liabilities | PAYE / VAT payment risk |
| retained_earnings_over_total_assets | Profit declaration consistency |
| EBIT_over_total_assets | Income tax base integrity |
| book_value_of_equity_over_total_liabilities | Financial stress indicator |
| sales_over_total_assets | VAT turnover consistency |
| equity_over_total_assets | Related-party loan risk |
| gross_profit_over_sales | Sector benchmark deviation |
| net_profit_over_sales | Income tax under-declaration |
| profit_on_operating_activities_over_total_assets | Expense inflation detection |

### Model Performance

Evaluated on 5,024 held-out test records (never seen during training):

| Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| High | 99% | 93% | 96% | 635 |
| Medium | 96% | 97% | 97% | 1,371 |
| Low | 99% | 100% | 99% | 3,018 |
| **Overall accuracy** | | | **98%** | 5,024 |

### Saved Model Artifacts

| File | Contents |
|---|---|
| `tax_risk_model.pkl` | Fitted RandomForestClassifier |
| `tax_risk_imputer.pkl` | Fitted SimpleImputer (median strategy) |
| `model_features.pkl` | Ordered list of 12 feature names |

The imputer handles missing financial fields — if a document does not
contain a particular value, the imputer fills it with the median from
the training dataset so the model never crashes on incomplete data.

---

## Running the Project

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.12 |
| Java | 21 |
| Node.js | 18 |
| PostgreSQL | 16 |
| RabbitMQ | 3.x |
| Angular CLI | 17+ |

### Environment Setup

Create a `.env` file in `/Doc-scanner/`:
```
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5432/fastapi_db
```

### Start All Services

**Terminal 1 — Document Scanner:**
```bash
cd Doc-scanner
source doc-scanner/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Risk Engine:**
```bash
cd Doc-scanner/risk-engine
source ../doc-scanner/bin/activate
python main.py
# Runs on port 8001
```

**Terminal 3 — Authentication Service:**
```bash
cd auth
mvn spring-boot:run
# Runs on port 8084
```

**Terminal 4 — Frontend:**
```bash
cd front-end
npm install
ng serve
# Runs on port 4200
```

Open `http://localhost:4200`

### Train the ML Model (Optional)

The trained `.pkl` files are included in `/Doc-scanner/risk-engine/models/`.
To retrain from scratch:

```bash
cd Doc-scanner/risk-engine/ml
jupyter notebook train_model.ipynb
```

Run all cells in order. The notebook will download the dataset,
clean and engineer labels, train the model, evaluate it, and save
the three artifact files.

---

## API Reference

### Document Scanner (port 8000)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload a PDF file |
| GET | `/api/files` | List all uploaded files |
| POST | `/api/analyze-all` | Trigger AI extraction on pending files |
| DELETE | `/api/files/{id}` | Delete a file |
| GET | `/health` | Service health check |
| WS | `/api/ws` | WebSocket for real-time status updates |

### Risk Engine (port 8001)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze-risk` | Compute risk score from financial JSON |
| POST | `/api/generate-report` | Generate full compliance report |
| GET | `/api/health` | Service health check |

### Auth Service (port 8084)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new company |
| POST | `/api/auth/login` | Login and receive JWT |

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Angular 17, TypeScript, WebSocket |
| Authentication | Spring Boot 3.5, Java 21, Spring Security, JWT |
| Document processing | FastAPI, Python 3.12, PyMuPDF, Gemini AI |
| ML / Risk engine | FastAPI, scikit-learn, pandas, numpy, joblib |
| Database | PostgreSQL 16, SQLAlchemy |
| Message queue | RabbitMQ (email delivery) |
| Notebook environment | Jupyter (Google Colab compatible) |

---

## Project Structure

```
Tax-Dash-Demo/
├── auth/                          # Spring Boot authentication service
│   └── src/main/java/...
│
├── Doc-scanner/                   # FastAPI document scanner
│   ├── main.py                    # App entry point (port 8000)
│   ├── database.py                # SQLAlchemy models
│   ├── websocket_manager.py       # Real-time WebSocket broadcasts
│   ├── routes/
│   │   ├── upload_routes.py       # File upload and management
│   │   └── scanner_routes.py     # Analysis trigger and WebSocket
│   ├── services/
│   │   ├── pdf_service.py         # PyMuPDF text extraction
│   │   └── gemini_service.py      # Gemini AI structured extraction
│   └── risk-engine/               # ML risk scoring service (port 8001)
│       ├── main.py
│       ├── models/                # Saved .pkl model artifacts
│       │   ├── tax_risk_model.pkl
│       │   ├── tax_risk_imputer.pkl
│       │   └── model_features.pkl
│       ├── ml/
│       │   └── train_model.ipynb  # Full training pipeline
│       ├── routes/
│       │   └── risk_routes.py     # /analyze-risk and /generate-report
│       └── services/
│           ├── risk_service.py    # Ratio computation + flag generation
│           └── model_service.py   # Model loading + prediction
│
└── front-end/                     # Angular SPA (port 4200)
    └── src/app/...
```

---

## Author

**Onyango Stanley Otieno**  
BSc Computer Science — Egerton University  
COMP 493: Computer Systems Project — 2026