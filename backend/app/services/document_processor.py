import re
import fitz  # PyMuPDF
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Basic text cleaning."""
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

import numpy as np
import easyocr

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text page by page from a PDF using PyMuPDF.
    If the text is too short (likely scanned), falls back to EasyOCR.
    Returns a list of dicts with page number and text.
    """
    pages = []
    try:
        doc = fitz.open(file_path)
        reader = None
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            cleaned_text = clean_text(text)
            
            # Fallback to OCR if less than 50 characters are extracted
            if len(cleaned_text) < 50:
                print(f"Page {page_num + 1} of {file_path} seems scanned. Using OCR...")
                if reader is None:
                    reader = easyocr.Reader(['mr', 'hi', 'en'], gpu=False)
                
                # Render page to an image (200 DPI is usually sufficient for OCR)
                pix = page.get_pixmap(dpi=200)
                # Convert to numpy array
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                if pix.n == 4: # Convert RGBA to RGB
                    img = img[:, :, :3]
                    
                result = reader.readtext(img, detail=0)
                ocr_text = " ".join(result)
                cleaned_text = clean_text(ocr_text)
                
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
