import os
import PyPDF2
import docx
from utils.logger import get_logger

logger = get_logger(__name__)

class FileProcessingService:
    @staticmethod
    def extract_text(file_path):
        """Extract text from PDF or DOCX file"""
        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if ext == '.pdf':
                return FileProcessingService._extract_from_pdf(file_path)
            elif ext in ['.doc', '.docx']:
                return FileProcessingService._extract_from_docx(file_path)
            elif ext == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            else:
                raise ValueError(f"Unsupported file type: {ext}")
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            raise

    @staticmethod
    def _extract_from_pdf(file_path):
        text = ""
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text

    @staticmethod
    def _extract_from_docx(file_path):
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
