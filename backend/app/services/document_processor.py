import re
import fitz  # PyMuPDF
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Basic text cleaning."""
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text page by page from a PDF using PyMuPDF.
    Returns a list of dicts with page number and text.
    """
    pages = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            cleaned_text = clean_text(text)
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
