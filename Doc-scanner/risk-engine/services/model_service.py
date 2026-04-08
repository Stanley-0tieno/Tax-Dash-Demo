import joblib
import os

# Paths relative to risk-engine/
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

_model    = None
_imputer  = None
_features = None


def load_models():
    """Load ML model, imputer and feature list into memory."""
    global _model, _imputer, _features
    try:
        _model    = joblib.load(os.path.join(MODELS_DIR, "tax_risk_model.pkl"))
        _imputer  = joblib.load(os.path.join(MODELS_DIR, "tax_risk_imputer.pkl"))
        _features = joblib.load(os.path.join(MODELS_DIR, "model_features.pkl"))
        print("✅ ML models loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load models: {e}")
        raise


def predict_risk(input_data: dict) -> dict:
    """
    Run prediction on a dict of financial ratios.
    Returns risk level, confidence scores, and model classes.
    """
    import pandas as pd

    if _model is None:
        raise RuntimeError("Models not loaded. Call load_models() first.")

    df = pd.DataFrame([input_data])[_features]
    imputed = _imputer.transform(df)

    prediction    = _model.predict(imputed)[0]
    probabilities = _model.predict_proba(imputed)[0]
    classes       = _model.classes_.tolist()

    confidence = {
        cls: round(float(prob) * 100, 1)
        for cls, prob in zip(classes, probabilities)
    }

    return {
        "risk_level":   prediction,
        "confidence":   confidence,
        "top_class":    prediction,
    }