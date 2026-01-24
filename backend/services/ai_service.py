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

    def generate_learning_path(self, interest, current_level=1):
        """Generate a 4-week learning path based on interest"""
        if not os.getenv("GOOGLE_API_KEY"):
            raise ValueError("Google API Key is missing")

        prompt = f"""
        You are a personalized curriculum designer. Create a 4-week learning path for a student 
        interested in: "{interest}".
        The student is currently at level {current_level} (Beginner/Intermediate).

        Return the result as a VALID JSON object. Do not include markdown formatting or '```json'.
        
        CRITICAL INSTRUCTION FOR RESOURCES:
        - You MUST provide REAL, WORKING URLs for every resource.
        - Do NOT use "example.com" or placeholders.
        - Prefer stable, high-quality sources: YouTube videos, Wikipedia articles, Coursera/EdX pages, Medium/Dev.to articles, or official documentation.
        - If a specific direct link is hard to guarantee, use a high-confidence Google Search URL for the specific topic (e.g. "https://www.google.com/search?q=topic"). But prefer direct content links.

        The JSON structure must be:
        {{
            "title": "Engaging Title for the Path",
            "description": "Brief inspiring description",
            "weeks": [
                {{
                    "week": 1,
                    "theme": "Theme of the week",
                    "goals": ["Goal 1", "Goal 2"],
                    "resources": [
                        {{"title": "Actual Resource Title", "type": "Video/Article", "url": "https://www.youtube.com/watch?v=..."}}
                    ]
                }}
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            content = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"Learning path generation failed: {e}")
            raise
