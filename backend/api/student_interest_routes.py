from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
import math

# Import MongoDB helper functions
from models.database import (
    db, find_one, find_many, aggregate, insert_one,
    STUDENTS, STUDENT_CONCEPT_MASTERY, CONCEPTS, PROJECTS, 
    PROJECT_GRADES, TEAM_MEMBERSHIPS, TEAM_PROGRESS, STUDENT_LEARNING_PATHS
)
from utils.logger import get_logger
from services.ai_service import AIService

interest_bp = Blueprint('interest', __name__)
logger = get_logger(__name__)
ai_service = AIService()

CAREER_MAP = {
    'Math': ['Data Scientist', 'Financial Analyst', 'Cryptographer', 'Actuary'],
    'Science': ['Biomedical Engineer', 'Environmental Scientist', 'Researcher', 'Geologist'],
    'Technology': ['Software Engineer', 'Robotics Specialist', 'AI Architect', 'Cybersecurity Analyst'],
    'Art': ['UX Designer', 'Digital Artist', 'Creative Director', 'Animator'],
    'History': ['Policy Analyst', 'Historian', 'Sociologist', 'Archivist'],
    'Literature': ['Content Strategist', 'Editor', 'Communications Lead', 'Journalist'],
    'General': ['Project Manager', 'Consultant']
}

def get_current_user_id():
    """Get current user ID from JWT token (simplified)"""
    return request.headers.get('X-User-Id')

@interest_bp.route('/path', methods=['GET'])
def get_interest_path():
    """
    Get student's interest profile based on mastery and engagement.
    Calculates a weighted score for different subjects.
    """
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        # 1. Resolve Student
        student = find_one(STUDENTS, {'user_id': user_id})
        if not student:
            # Try finding by _id directly if passed as user_id
            student = find_one(STUDENTS, {'_id': user_id})
        
        if not student:
             return jsonify({'error': 'Student profile not found'}), 404

        student_id = str(student['_id'])
        logger.info(f"Generating interest path for student: {student_id}")

        # 2. Aggregate Mastery Scores by Subject
        # ------------------------------------------------
        mastery_docs = find_many(STUDENT_CONCEPT_MASTERY, {'student_id': student_id})
        subject_scores = {}
        subject_counts = {}

        for doc in mastery_docs:
            c_id = doc['concept_id']
            concept = find_one(CONCEPTS, {'_id': c_id})
            
            # Fallback: Try ObjectId conversion if not found
            if not concept and isinstance(c_id, str) and ObjectId.is_valid(c_id):
                concept = find_one(CONCEPTS, {'_id': ObjectId(c_id)})
            
            # Fallback: Try String conversion if not found
            if not concept and isinstance(c_id, ObjectId):
                concept = find_one(CONCEPTS, {'_id': str(c_id)})

            if concept and 'subject_area' in concept:
                subj = concept['subject_area']
                score = doc.get('mastery_score', 0)
                
                subject_scores[subj] = subject_scores.get(subj, 0) + score
                subject_counts[subj] = subject_counts.get(subj, 0) + 1

        # Calculate Average Mastery per Subject
        avg_mastery = {}
        for subj, total in subject_scores.items():
            avg_mastery[subj] = total / subject_counts[subj]
            
        logger.info(f"Mastery calculated | subjects: {list(avg_mastery.keys())} | scores: {avg_mastery}")

        # 3. Project Engagement (Project Counts)
        # ------------------------------------------------
        # Find teams student is in
        memberships = find_many(TEAM_MEMBERSHIPS, {'student_id': student_id})
        team_ids = [m['team_id'] for m in memberships]
        
        project_counts = {}
        if team_ids:
            # properly use ObjectId for queries if IDs are strings
            t_oids = []
            for tid in team_ids:
                try: t_oids.append(ObjectId(tid))
                except: pass
            
            teams = find_many(TEAMS, {'_id': {'$in': t_oids}}) if t_oids else []
            if not t_oids and team_ids:
                 # Try finding by string IDs if ObjectId conversion failed/not used
                 teams = find_many(TEAMS, {'_id': {'$in': team_ids}})

            project_ids = [t['project_id'] for t in teams if 'project_id' in t]
            
            if project_ids:
                p_oids = []
                for pid in project_ids:
                    try: p_oids.append(ObjectId(pid) if isinstance(pid, str) else pid)
                    except: pass

                projects = find_many(PROJECTS, {'_id': {'$in': p_oids}})
                
                for p in projects:
                    subj = p.get('subject', 'General') 
                    # If subject is missing, try to infer or default
                    if not p.get('subject') and 'title' in p:
                         pass
                    
                    project_counts[subj] = project_counts.get(subj, 0) + 1
                
                logger.info(f"Projects count by subject: {project_counts}")

        # 4. Calculate Weighted Interest Score
        # ------------------------------------------------
        interests = []
        all_subjects = set(avg_mastery.keys()) | set(project_counts.keys())
        
        # Ensure default subjects exist if data is sparse, to populate chart
        default_subjects = ['Math', 'Science', 'History', 'Art', 'Technology', 'Literature']
        for ds in default_subjects:
            if ds not in all_subjects:
                all_subjects.add(ds)

        for subj in all_subjects:
            m_score = avg_mastery.get(subj, 0) # 0-100
            p_score = min(project_counts.get(subj, 0) * 20, 100) # 5 projects = 100
            
            # Weight: Mastery 70%, Projects 30%
            weighted_score = (m_score * 0.7) + (p_score * 0.3)
            
            interests.append({
                'subject': subj,
                'score': round(weighted_score, 1),
                'mastery': round(m_score, 1),
                'projects': project_counts.get(subj, 0),
                'careers': CAREER_MAP.get(subj, ['Project Manager', 'Consultant'])
            })
            
        # Sort by score descending
        interests.sort(key=lambda x: x['score'], reverse=True)

        # 5. Get Latest Learning Path
        latest_path = find_one(
            STUDENT_LEARNING_PATHS, 
            {'student_id': student_id}
        )
        
        # If multiple exist, find_one might not get the latest unless sorted. 
        # Using find_many with sort/limit is safer for "latest", but pymongo find_one doesn't support sort kwarg directly in wrapper maybe?
        # The wrapper defined in database.py: find_one(collection_name, query, projection=None) -> db[...].find_one
        # It doesn't support sort.
        # So let's use check find_many with limit 1
        
        paths = find_many(
            STUDENT_LEARNING_PATHS, 
            {'student_id': student_id},
            sort=[('created_at', -1)],
            limit=1
        )
        
        latest_path = paths[0] if paths else None

        if latest_path:
            latest_path['_id'] = str(latest_path['_id'])
            if 'created_at' in latest_path:
                latest_path['created_at'] = latest_path['created_at'].isoformat()

        return jsonify({'interests': interests, 'learning_path': latest_path}), 200

    except Exception as e:
        logger.error(f"Error generating interest path: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500

@interest_bp.route('/generate-path', methods=['POST'])
def generate_path():
    """Generate a new AI learning path based on user input"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
            
        data = request.get_json()
        interest_text = data.get('interest')
        
        if not interest_text:
            return jsonify({'error': 'Interest description is required'}), 400

        # Resolve Student
        student = find_one(STUDENTS, {'user_id': user_id})
        if not student:
             student = find_one(STUDENTS, {'_id': user_id})
             
        if not student:
             return jsonify({'error': 'Student profile not found'}), 404
             
        student_id = str(student['_id'])
        
        # Call AI Service
        try:
            # We assume level 1 for now, or could fetch from profile
            path_data = ai_service.generate_learning_path(interest_text, current_level=1)
        except Exception as e:
            return jsonify({'error': 'Failed to generate content', 'detail': str(e)}), 503
            
        # Save to Database
        path_document = {
            'student_id': student_id,
            'interest_query': interest_text,
            'path_data': path_data,
            'created_at': datetime.utcnow()
        }
        
        new_id = insert_one(STUDENT_LEARNING_PATHS, path_document)
        
        # Prepare response
        path_document['_id'] = str(new_id)
        path_document['created_at'] = path_document['created_at'].isoformat()
        
        return jsonify({'message': 'Path generated successfully', 'path': path_document}), 201

    except Exception as e:
        logger.error(f"Error generating learning path: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
