from flask import Blueprint, request, jsonify
from services.ai_service import AIService
from services.file_processing_service import FileProcessingService
from models.database import db, QUESTION_BANKS, insert_one, find_many, find_one
from utils.logger import get_logger
import os
from bson import ObjectId

logger = get_logger(__name__)
resource_bp = Blueprint('resource', __name__)

ai_service = AIService()

@resource_bp.route('/generate-questions', methods=['POST'])
def generate_questions():
    try:
        data = request.json
        file_url = data.get('file_url')
        difficulty = data.get('difficulty')
        title = data.get('title')
        teacher_id = data.get('teacher_id')
        
        if not all([file_url, difficulty, title, teacher_id]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Construct absolute file path from URL
        # URL format: /api/uploads/filename -> file path: backend/static/uploads/filename
        filename = file_url.split('/')[-1]
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(base_dir, 'static', 'uploads', filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        # Extract text
        text_content = FileProcessingService.extract_text(file_path)
        
        # Generate questions
        questions = ai_service.generate_questions(text_content, difficulty)
        
        # Save to DB
        bank_data = {
            'teacher_id': teacher_id,
            'title': title,
            'description': f"Generated from {filename} - {difficulty} Level",
            'resource_url': file_url,
            'difficulty_level': difficulty,
            'questions': questions,
            'is_active': True
        }
        
        bank_id = insert_one(QUESTION_BANKS, bank_data)
        
        return jsonify({
            'message': 'Question bank generated successfully',
            'bank_id': bank_id,
            'questions_count': len(questions)
        }), 201

    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@resource_bp.route('/question-banks', methods=['GET'])
def get_question_banks():
    try:
        teacher_id = request.args.get('teacher_id')
        query = {}
        if teacher_id:
            query['teacher_id'] = teacher_id
            
        banks = find_many(QUESTION_BANKS, query, sort=[('created_at', -1)])
        
        # Convert ObjectId to string
        for bank in banks:
            bank['_id'] = str(bank['_id'])
            
        return jsonify(banks), 200

    except Exception as e:
        logger.error(f"Fetch error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@resource_bp.route('/question-banks/<bank_id>', methods=['GET'])
def get_question_bank_detail(bank_id):
    try:
        bank = find_one(QUESTION_BANKS, {'_id': ObjectId(bank_id)})
        
        if not bank:
            return jsonify({'error': 'Question bank not found'}), 404
            
        bank['_id'] = str(bank['_id'])
        return jsonify(bank), 200

    except Exception as e:
        logger.error(f"Detail fetch error: {str(e)}")
        return jsonify({'error': str(e)}), 500
