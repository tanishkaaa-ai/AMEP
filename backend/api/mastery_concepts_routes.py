from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from models.database import find_one, find_many, insert_one, update_one, delete_one
from utils.logger import get_logger

concepts_bp = Blueprint('concepts', __name__)
logger = get_logger(__name__)

CONCEPTS = 'concepts'
PRACTICE_ITEMS = 'practice_items'

@concepts_bp.route('/concepts', methods=['GET'])
def get_concepts():
    try:
        subject_area = request.args.get('subject_area')
        grade_level = request.args.get('grade_level')
        classroom_id = request.args.get('classroom_id')

        query = {}
        if subject_area:
            query['subject_area'] = subject_area
        if grade_level:
            query['grade_level'] = int(grade_level)
        if classroom_id:
            query['classroom_id'] = classroom_id

        concepts = find_many(CONCEPTS, query, sort=[('subject_area', 1), ('name', 1)])

        result = []
        for concept in concepts:
            result.append({
                'concept_id': concept['_id'],
                'classroom_id': concept.get('classroom_id'),
                'name': concept.get('name'),
                'subject_area': concept.get('subject_area'),
                'grade_level': concept.get('grade_level'),
                'description': concept.get('description'),
                'prerequisites': concept.get('prerequisites', []),
                'difficulty_level': concept.get('difficulty_level')
            })

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/concepts', methods=['POST'])
def create_concept():
    try:
        data = request.json

        if not data.get('name') or not data.get('subject_area'):
            return jsonify({'error': 'name and subject_area are required'}), 400

        concept_doc = {
            '_id': str(ObjectId()),
            'classroom_id': data.get('classroom_id'),  # Optional for now to support global concepts, or Make required if strict
            'name': data['name'],
            'subject_area': data['subject_area'],
            'grade_level': data.get('grade_level'),
            'description': data.get('description', ''),
            'prerequisites': data.get('prerequisites', []),
            'difficulty_level': data.get('difficulty_level', 'medium'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        concept_id = insert_one(CONCEPTS, concept_doc)
        return jsonify({'concept_id': concept_id, 'message': 'Concept created successfully'}), 201
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/concepts/<concept_id>', methods=['GET'])
def get_concept(concept_id):
    try:
        concept = find_one(CONCEPTS, {'_id': concept_id})
        if not concept:
            return jsonify({'error': 'Concept not found'}), 404

        return jsonify({
            'concept_id': concept['_id'],
            'name': concept.get('name'),
            'subject_area': concept.get('subject_area'),
            'grade_level': concept.get('grade_level'),
            'description': concept.get('description'),
            'prerequisites': concept.get('prerequisites', []),
            'difficulty_level': concept.get('difficulty_level')
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/concepts/<concept_id>', methods=['PUT'])
def update_concept(concept_id):
    try:
        data = request.json
        concept = find_one(CONCEPTS, {'_id': concept_id})
        if not concept:
            return jsonify({'error': 'Concept not found'}), 404

        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'prerequisites' in data:
            update_data['prerequisites'] = data['prerequisites']
        if 'difficulty_level' in data:
            update_data['difficulty_level'] = data['difficulty_level']

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            update_one(CONCEPTS, {'_id': concept_id}, {'$set': update_data})
            return jsonify({'message': 'Concept updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/concepts/<concept_id>', methods=['DELETE'])
def delete_concept(concept_id):
    try:
        concept = find_one(CONCEPTS, {'_id': concept_id})
        if not concept:
            return jsonify({'error': 'Concept not found'}), 404

        delete_one(CONCEPTS, {'_id': concept_id})
        return jsonify({'message': 'Concept deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/items', methods=['GET'])
def get_items():
    try:
        concept_id = request.args.get('concept_id')
        difficulty = request.args.get('difficulty')

        query = {}
        if concept_id:
            query['concept_id'] = concept_id
        if difficulty:
            query['difficulty'] = difficulty

        items = find_many(PRACTICE_ITEMS, query, sort=[('difficulty', 1)])

        result = []
        for item in items:
            result.append({
                'item_id': item['_id'],
                'concept_id': item.get('concept_id'),
                'item_type': item.get('item_type'),
                'difficulty': item.get('difficulty'),
                'question': item.get('question'),
                'options': item.get('options', []),
                'correct_answer': item.get('correct_answer')
            })

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/items', methods=['POST'])
def create_item():
    try:
        data = request.json

        if not data.get('concept_id') or not data.get('question'):
            return jsonify({'error': 'concept_id and question are required'}), 400

        item_doc = {
            '_id': str(ObjectId()),
            'concept_id': data['concept_id'],
            'item_type': data.get('item_type', 'multiple_choice'),
            'difficulty': data.get('difficulty', 'medium'),
            'question': data['question'],
            'options': data.get('options', []),
            'correct_answer': data.get('correct_answer'),
            'explanation': data.get('explanation', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        item_id = insert_one(PRACTICE_ITEMS, item_doc)
        return jsonify({'item_id': item_id, 'message': 'Practice item created successfully'}), 201
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/items/<item_id>', methods=['GET'])
def get_item(item_id):
    try:
        item = find_one(PRACTICE_ITEMS, {'_id': item_id})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        return jsonify({
            'item_id': item['_id'],
            'concept_id': item.get('concept_id'),
            'item_type': item.get('item_type'),
            'difficulty': item.get('difficulty'),
            'question': item.get('question'),
            'options': item.get('options', []),
            'correct_answer': item.get('correct_answer'),
            'explanation': item.get('explanation')
        }), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/items/<item_id>', methods=['PUT'])
def update_item(item_id):
    try:
        data = request.json
        item = find_one(PRACTICE_ITEMS, {'_id': item_id})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        update_data = {}
        if 'question' in data:
            update_data['question'] = data['question']
        if 'options' in data:
            update_data['options'] = data['options']
        if 'correct_answer' in data:
            update_data['correct_answer'] = data['correct_answer']
        if 'difficulty' in data:
            update_data['difficulty'] = data['difficulty']
        if 'explanation' in data:
            update_data['explanation'] = data['explanation']

        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            update_one(PRACTICE_ITEMS, {'_id': item_id}, {'$set': update_data})
            return jsonify({'message': 'Item updated successfully'}), 200

        return jsonify({'error': 'No valid fields to update'}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@concepts_bp.route('/items/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        item = find_one(PRACTICE_ITEMS, {'_id': item_id})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        delete_one(PRACTICE_ITEMS, {'_id': item_id})
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500
