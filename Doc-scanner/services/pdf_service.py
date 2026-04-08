import fitz  # PyMuPDF

try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


def extract_text_from_pdf(pdf_bytes: bytes, use_ocr: bool = False) -> str:
    """
    Extract raw text from PDF using PyMuPDF.
    Falls back to OCR for scanned documents if pytesseract is available.
    """
    try:
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""

        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            page_text = page.get_text()

            if use_ocr and OCR_AVAILABLE and len(page_text.strip()) < 50:
                try:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    page_text = pytesseract.image_to_string(img)
                except Exception as ocr_error:
                    print(f"OCR failed on page {page_num + 1}: {ocr_error}")

            text += page_text + "\n"

        pdf_document.close()

        if not text or len(text.strip()) < 10:
            raise RuntimeError(
                "No text extracted. PDF may be empty, corrupted, or require OCR."
            )

        return text.strip()

    except Exception as e:
        raise RuntimeError(f"PDF text extraction failed: {str(e)}")


def extract_from_pdf(pdf_bytes: bytes, use_ocr: bool = False) -> dict:
    """
    Full extraction pipeline:
    1. Extract raw text locally with PyMuPDF
    2. Pass text to Gemini for structured JSON output

    Returns:
        { "success": bool, "data": dict, "error": str }
    """
    try:
        text = extract_text_from_pdf(pdf_bytes, use_ocr=use_ocr)

        from .gemini_service import extract_financial_data
        return extract_financial_data(text)

    except RuntimeError as e:
        return {"success": False, "error": "PDF processing failed", "details": str(e)}
    except Exception as e:
        return {"success": False, "error": "Unexpected error", "details": str(e)}