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

SUBJECT_KEYWORDS = {
    'Math': ['math', 'algebra', 'calc', 'stat', 'number', 'logic', 'data', 'finance'],
    'Science': ['science', 'bio', 'chem', 'phys', 'space', 'envir', 'solar', 'planet', 'animal', 'plant', 'medicin'],
    'Technology': ['tech', 'code', 'robot', 'comput', 'game', 'app', 'softw', 'cyber', 'ai', 'data', 'web', 'program'],
    'Art': ['art', 'design', 'paint', 'draw', 'music', 'creat', 'anim', 'ux', 'ui', 'fash'],
    'History': ['hist', 'war', 'ancien', 'gov', 'polic', 'world', 'cultur', 'socie', 'civ'],
    'Literature': ['book', 'writ', 'stor', 'novel', 'poem', 'lang', 'english', 'journal']
}

def get_current_user_id():
    """Get current user ID from JWT token (simplified)"""
    return request.headers.get('X-User-Id')

@interest_bp.route('/path', methods=['GET'])
def get_interest_path():
    """
    Get student's interest profile based on mastery, engagement, and SEARCH HISTORY.
    """
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401

        # 1. Resolve Student
        student = find_one(STUDENTS, {'user_id': user_id})
        if not student:
            student = find_one(STUDENTS, {'_id': user_id})
        
        if not student:
             return jsonify({'error': 'Student profile not found'}), 404

        student_id = str(student['_id'])
        logger.info(f"Generating interest path for student: {student_id}")

        # 2. Aggregate Mastery Scores by Subject
        mastery_docs = find_many(STUDENT_CONCEPT_MASTERY, {'student_id': student_id})
        subject_scores = {}
        subject_counts = {}

        for doc in mastery_docs:
            c_id = doc['concept_id']
            concept = find_one(CONCEPTS, {'_id': c_id})
            
            if not concept and isinstance(c_id, str) and ObjectId.is_valid(c_id):
                concept = find_one(CONCEPTS, {'_id': ObjectId(c_id)})
            
            if not concept and isinstance(c_id, ObjectId):
                concept = find_one(CONCEPTS, {'_id': str(c_id)})

            if concept and 'subject_area' in concept:
                subj = concept['subject_area']
                score = doc.get('mastery_score', 0)
                subject_scores[subj] = subject_scores.get(subj, 0) + score
                subject_counts[subj] = subject_counts.get(subj, 0) + 1

        avg_mastery = {}
        for subj, total in subject_scores.items():
            avg_mastery[subj] = total / subject_counts[subj]

        # 3. Project Engagement (Project Counts)
        memberships = find_many(TEAM_MEMBERSHIPS, {'student_id': student_id})
        team_ids = [m['team_id'] for m in memberships]
        
        project_counts = {}
        if team_ids:
            t_oids = []
            for tid in team_ids:
                try: t_oids.append(ObjectId(tid))
                except: pass
            
            teams = find_many(TEAMS, {'_id': {'$in': t_oids}}) if t_oids else []
            if not t_oids and team_ids:
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
                    project_counts[subj] = project_counts.get(subj, 0) + 1

        # 4. Search History Analysis (NEW)
        # ------------------------------------------------
        search_docs = find_many(STUDENT_LEARNING_PATHS, {'student_id': student_id}, sort=[('created_at', -1)], limit=10)
        search_counts = {}
        search_history = []

        for doc in search_docs:
            if 'interest_query' in doc:
                query = doc['interest_query'].lower()
                
                # Format for display
                date_str = doc.get('created_at', datetime.utcnow())
                if isinstance(date_str, datetime):
                    date_str = date_str.strftime('%Y-%m-%d')
                
                search_history.append({
                    'query': doc['interest_query'],
                    'date': date_str
                })

                # Keyword Analysis
                for subj, keywords in SUBJECT_KEYWORDS.items():
                    if any(k in query for k in keywords):
                        search_counts[subj] = search_counts.get(subj, 0) + 1

        # 5. Calculate Weighted Interest Score
        # ------------------------------------------------
        interests = []
        all_subjects = set(avg_mastery.keys()) | set(project_counts.keys()) | set(search_counts.keys())
        
        default_subjects = ['Math', 'Science', 'History', 'Art', 'Technology', 'Literature']
        for ds in default_subjects:
            all_subjects.add(ds)

        for subj in all_subjects:
            m_score = avg_mastery.get(subj, 0) # 0-100
            
            # Project Score: Cap at 100 for 5 projects
            p_score = min(project_counts.get(subj, 0) * 20, 100)
            
            # Search Score: Cap at 100 for 4 relevant searches
            s_score = min(search_counts.get(subj, 0) * 25, 100) 
            
            # NEW Weight: Mastery 60%, Projects 20%, Search Interest 20%
            weighted_score = (m_score * 0.6) + (p_score * 0.2) + (s_score * 0.2)
            
            interests.append({
                'subject': subj,
                'score': round(weighted_score, 1),
                'mastery': round(m_score, 1),
                'projects': project_counts.get(subj, 0),
                'searches': search_counts.get(subj, 0),
                'careers': CAREER_MAP.get(subj, ['Project Manager', 'Consultant'])
            })
            
        interests.sort(key=lambda x: x['score'], reverse=True)

        # 6. Get Latest Learning Path
        latest_path = search_docs[0] if search_docs else None
        
        if latest_path:
            latest_path['_id'] = str(latest_path['_id'])
            if 'created_at' in latest_path and isinstance(latest_path['created_at'], datetime):
                latest_path['created_at'] = latest_path['created_at'].isoformat()

        return jsonify({
            'interests': interests, 
            'learning_path': latest_path,
            'search_history': search_history # Return history to frontend
        }), 200

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
