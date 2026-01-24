import os
import json
import google.generativeai as genai
from utils.logger import get_logger

logger = get_logger(__name__)

class AIService:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("GOOGLE_API_KEY not found in environment variables")
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-flash-latest')

    def generate_questions(self, text, difficulty, num_questions=10):
        """Generate MCQs from text using Gemini with retry logic"""
        if not os.getenv("GOOGLE_API_KEY"):
            raise ValueError("Google API Key is missing")

        prompt = f"""
        You are an educational expert. Create a question bank of {num_questions} multiple-choice questions (MCQs) 
        based on the provided text. The difficulty level should be '{difficulty}'.
        
        Return the result as a VALID JSON array of objects. Do not include markdown formatting or '```json'.
        Each object must have:
        - "question": string
        - "options": array of 4 strings
        - "correct_answer": string (must be one of the options)
        - "explanation": string (brief explanation of why it's correct)
        
        Text Content:
        {text[:10000]}  # Limit text to avoid token limits if necessary
        """
        
        import time
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                
                # Clean response if it contains markdown code blocks
                content = response.text.replace('```json', '').replace('```', '').strip()
                
                questions = json.loads(content)
                return questions
            except Exception as e:
                error_str = str(e)
                if "429" in error_str and attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 5  # 5s, 10s, 20s
                    logger.warning(f"Quota exceeded (429). Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                
                logger.error(f"AI Generation failed: {error_str}")
                raise
