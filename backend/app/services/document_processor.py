import re
import fitz  # PyMuPDF
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Basic text cleaning."""
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

import numpy as np
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter

# Lazy-loaded EasyOCR reader (only initialized if Tesseract fails)
_easyocr_reader = None

def _get_easyocr_reader():
    """Lazy-load EasyOCR reader to avoid slow startup."""
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr
        _easyocr_reader = easyocr.Reader(['mr', 'hi', 'en'], gpu=False)
    return _easyocr_reader

def _preprocess_image_for_ocr(img: Image.Image) -> Image.Image:
    """
    Preprocess a PIL Image for better OCR accuracy on scanned documents.
    Applies grayscale conversion, contrast enhancement, sharpening, and binarization.
    """
    # Convert to grayscale
    img = img.convert('L')
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)
    # Binarize (Otsu-like threshold)
    img = img.point(lambda x: 0 if x < 128 else 255, '1')
    return img

def _ocr_with_tesseract(img: Image.Image) -> str:
    """Run Tesseract OCR on a PIL Image with Marathi + Hindi + English support."""
    try:
        # Use mar+hin+eng for Devanagari script support
        text = pytesseract.image_to_string(img, lang='mar+hin+eng', config='--psm 6')
        return text
    except Exception as e:
        print(f"Tesseract OCR failed: {e}")
        return ""

def _ocr_with_easyocr(img_np: np.ndarray) -> str:
    """Run EasyOCR on a numpy array image."""
    try:
        reader = _get_easyocr_reader()
        result = reader.readtext(img_np, detail=0)
        return " ".join(result)
    except Exception as e:
        print(f"EasyOCR failed: {e}")
        return ""

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text page by page from a PDF using PyMuPDF.
    If the text is too short (likely scanned), falls back to EasyOCR.
    """
    pages = []
    try:
        doc = fitz.open(file_path)
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            cleaned_text = clean_text(text)
            
            # Fallback to OCR if less than 50 characters are extracted
            if len(cleaned_text) < 50:
                print(f"Page {page_num + 1} of {file_path} seems scanned. Using OCR...")
                
                # Render page to an image (300 DPI for better OCR accuracy)
                pix = page.get_pixmap(dpi=300)
                # Convert to PIL Image
                pil_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                print(f"  Running EasyOCR...")
                # Convert original image to numpy for EasyOCR
                img_np = np.array(pil_img)
                ocr_text = _ocr_with_easyocr(img_np)
                cleaned_text = clean_text(ocr_text)
                print(f"  EasyOCR produced {len(cleaned_text)} chars.")
                
            pages.append({
                "page_number": page_num + 1,
                "text": cleaned_text
            })
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
    return pages

def chunk_text_section_aware(pages: List[Dict[str, Any]], chunk_size: int = 1000) -> List[Dict[str, Any]]:
    """
    Chunks text. Attempts section-aware chunking for legal documents.
    Fallback to paragraph/token chunking.
    """
    chunks = []
    current_chunk = ""
    current_pages = set()
    current_section = "Unknown"
    
    # Regex to detect common legal section headers (English and Marathi)
    section_pattern = re.compile(r'^(Section\s+\d+|कलम\s+\d+|Chapter\s+[IVX]+|अध्याय\s+\d+)', re.IGNORECASE)
    
    for page in pages:
        page_num = page["page_number"]
        text = page["text"]
        
        # Split by double newline to approximate paragraphs
        paragraphs = text.split('\n')
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            # Check if paragraph is a new section header
            match = section_pattern.match(para)
            if match:
                # If we have a pending chunk, save it
                if current_chunk:
                    chunks.append({
                        "text": current_chunk.strip(),
                        "pages": list(current_pages),
                        "section": current_section
                    })
                current_chunk = para + "\n"
                current_pages = {page_num}
                current_section = match.group(1)
            else:
                # Add to current chunk
                current_chunk += para + " "
                current_pages.add(page_num)
                
            # If chunk is getting too large, split it even if it's the same section
            if len(current_chunk) > chunk_size:
                chunks.append({
                    "text": current_chunk.strip(),
                    "pages": list(current_pages),
                    "section": current_section
                })
                current_chunk = ""
                current_pages = set()
                
    if current_chunk:
        chunks.append({
            "text": current_chunk.strip(),
            "pages": list(current_pages),
            "section": current_section
        })
        
    return chunks

def process_document(file_path: str) -> List[Dict[str, Any]]:
    """Main pipeline for processing a document."""
    pages = extract_text_from_pdf(file_path)
    if not pages:
        return []
    chunks = chunk_text_section_aware(pages)
    return chunks
