"""
Student Interest Path Routes
Calculates student interests based on mastery, engagement, and projects.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from models.database import (
    db, STUDENTS, USERS, TEACHERS, 
    STUDENT_CONCEPT_MASTERY, CONCEPTS, 
    PROJECTS, PROJECT_GRADES, TEAM_MEMBERSHIPS,
    find_one, find_many
)
from utils.logger import get_logger

interest_bp = Blueprint('interest', __name__)
logger = get_logger(__name__)

# Career Mappings (Mock/Static for now)
CAREER_MAP = {
    'Mathematics': ['Data Scientist', 'Financial Analyst', 'Cryptographer'],
    'Algebra': ['Software Engineer', 'Algorithm Researcher'],
    'Geometry': ['Architect', '3D Modeler', 'Civil Engineer'],
    'Physics': ['Mechanical Engineer', 'Aerospace Engineer'],
    'Chemistry': ['Pharmacist', 'Chemical Engineer'],
    'Biology': ['Medical Doctor', 'Biotechnologist'],
    'Literature': ['Content Strategist', 'Editor', 'Journalist'],
    'History': ['Political Analyst', 'Archivist'],
    'Computer Science': ['Full Stack Developer', 'AI Engineer', 'System Architect']
}

@interest_bp.route('/path', methods=['GET'])
def get_interest_path():
    """
    Get calculated interest path for a student
    
    Headers: X-User-Id: <student_id>
    """
    try:
        # Get Student ID (User ID from token/header)
        user_id = request.headers.get('X-User-Id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
            
        # Resolve Student Profile
        student = find_one(STUDENTS, {'user_id': user_id})
        if not student:
            # Try finding by _id if user_id fails
            if len(user_id) == 24:
                try: 
                     student = find_one(STUDENTS, {'_id': ObjectId(user_id)})
                except: pass
        
        if not student:
             # Fallback to User ID as Student ID if profile missing (legacy/stub)
             student_id = user_id 
        else:
             student_id = str(student['_id'])

        logger.info(f"Calculating interest path | Student: {student_id}")

        # 1. Aggregate Mastery Scores by Subject
        # ------------------------------------------------
        mastery_docs = find_many(STUDENT_CONCEPT_MASTERY, {'student_id': student_id})
        subject_scores = {}
        subject_counts = {}

        for doc in mastery_docs:
            concept = find_one(CONCEPTS, {'_id': doc['concept_id']})
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

        # 2. Project Engagement (Project Counts)
        # ------------------------------------------------
        # Find teams student is in
        memberships = find_many(TEAM_MEMBERSHIPS, {'student_id': student_id})
        team_ids = [m['team_id'] for m in memberships]
        logger.info(f"Student memberships found | count: {len(memberships)} | team_ids: {team_ids}")
        
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
            logger.info(f"Teams found | count: {len(teams)} | project_ids: {project_ids}")
            
            if project_ids:
                p_oids = []
                for pid in project_ids:
                    try: p_oids.append(ObjectId(pid) if isinstance(pid, str) else pid)
                    except: pass

                projects = find_many(PROJECTS, {'_id': {'$in': p_oids}})
                
                for p in projects:
                    subj = p.get('subject', 'General') 
                    # If subject is missing, maybe infer from title or tags?
                    if not p.get('subject') and 'title' in p:
                         # Simple heuristic or default
                         pass
                    
                    project_counts[subj] = project_counts.get(subj, 0) + 1
                
                logger.info(f"Projects count by subject: {project_counts}")

        # 3. Calculate Weighted Interest Score
        # ------------------------------------------------
        # Score = (MasteryAvg * 0.6) + (ProjectCount * 20) capped at 100?
        # Let's normalize.
        
        final_scores = []
        all_subjects = set(avg_mastery.keys()) | set(project_counts.keys())
        
        for subj in all_subjects:
            m_score = avg_mastery.get(subj, 0) # 0-100
            p_score = min(project_counts.get(subj, 0) * 20, 100) # 5 projects = 100
            
            # Weight: Mastery 70%, Projects 30%
            weighted_score = (m_score * 0.7) + (p_score * 0.3)
            
            final_scores.append({
                'subject': subj,
                'score': round(weighted_score, 1),
                'mastery': round(m_score, 1),
                'projects': project_counts.get(subj, 0),
                'careers': CAREER_MAP.get(subj, ['General Specialist'])
            })
            
        # Sort by score descending
        final_scores.sort(key=lambda x: x['score'], reverse=True)
        
        top_interests = final_scores[:5]

        return jsonify({
            'student_id': student_id,
            'interests': top_interests,
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Interest path calculation failed: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
