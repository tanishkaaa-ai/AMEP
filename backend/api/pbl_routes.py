"""
AMEP PBL Routes - ENHANCED with AI Engine Integration
API endpoints for BR5, BR9 (Project-Based Learning & Soft Skills)

Location: backend/api/pbl_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId

# Import MongoDB helper functions
from models.database import (
    db,
    PROJECTS,
    TEAMS,
    TEAM_MEMBERSHIPS,
    SOFT_SKILL_ASSESSMENTS,
    PROJECT_MILESTONES,
    PROJECT_ARTIFACTS,
    STUDENTS,
    find_one,
    find_many,
    insert_one,
    update_one,
    aggregate,
    count_documents
)

# Import AI Engine for Soft Skills
from ai_engine.soft_skills_assessment import (
    SoftSkillsEngine,
    SoftSkillRatings,
    AssessmentMetadata
)

# Import logging
from utils.logger import get_logger

pbl_bp = Blueprint('pbl', __name__)

# Initialize logger
logger = get_logger(__name__)

# Initialize Soft Skills AI Engine
logger.info("Initializing Soft Skills Assessment Engine")
soft_skills_engine = SoftSkillsEngine()

# ============================================================================
# PBL ROUTES (BR9)
# ============================================================================

@pbl_bp.route('/projects', methods=['GET'])
def list_projects():
    """
    BR9: Get all projects for a teacher or student
    """
    try:
        teacher_id = request.args.get('teacher_id')
        student_id = request.args.get('student_id')
        
        query = {}
        
        if teacher_id:
            query['teacher_id'] = teacher_id
        elif student_id:
            # Get teams the student is in
            memberships = find_many(TEAM_MEMBERSHIPS, {'student_id': student_id})
            team_ids = [m['team_id'] for m in memberships]
            
            # Get projects for those teams
            teams = find_many(TEAMS, {'_id': {'$in': team_ids}})
            project_ids = list(set(t['project_id'] for t in teams))
            
            query['_id'] = {'$in': project_ids}
        
        projects = find_many(PROJECTS, query, sort=[('start_date', -1)])
        
        formatted_projects = []
        for project in projects:
            # Count teams
            team_count = count_documents(TEAMS, {'project_id': project['_id']})
            
            formatted_projects.append({
                'project_id': project['_id'],
                'title': project.get('title'),
                'description': project.get('description'),
                'current_stage': project.get('current_stage'),
                'start_date': project.get('start_date').isoformat() if project.get('start_date') else None,
                'end_date': project.get('end_date').isoformat() if project.get('end_date') else None,
                'team_count': team_count,
                'created_at': project.get('created_at').isoformat() if project.get('created_at') else None
            })
        
        return jsonify(formatted_projects), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/projects', methods=['POST'])
def create_project():
    """
    BR9: Create new project
    """
    try:
        data = request.json
        logger.info(f"Project creation request | teacher_id: {data.get('teacher_id')} | title: {data.get('title')}")

        project_doc = {
            '_id': str(ObjectId()),
            'teacher_id': data['teacher_id'],
            'title': data['title'],
            'description': data.get('description'),
            'start_date': datetime.fromisoformat(data['start_date']),
            'end_date': datetime.fromisoformat(data['end_date']),
            'current_stage': data.get('current_stage', 'questioning'),
            'curriculum_alignment': data.get('curriculum_alignment'),
            'created_at': datetime.utcnow()
        }
        
        project_id = insert_one(PROJECTS, project_doc)
        logger.info(f"Project created | project_id: {project_id} | title: {data['title']}")

        return jsonify({
            'project_id': project_id,
            'message': 'Project created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/projects/<project_id>', methods=['GET'])
def get_project_details(project_id):
    """
    BR9: Get detailed project information
    """
    try:
        project = find_one(PROJECTS, {'_id': project_id})
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get stages (hardcoded for now, could be in DB)
        stages = [
            {
                'id': 'questioning',
                'name': 'Questioning',
                'status': 'completed' if project['current_stage'] != 'questioning' else 'in_progress'
            },
            {
                'id': 'define',
                'name': 'Define',
                'status': 'completed' if project['current_stage'] not in ['questioning', 'define'] else 
                         'in_progress' if project['current_stage'] == 'define' else 'pending'
            },
            {
                'id': 'research',
                'name': 'Research',
                'status': 'completed' if project['current_stage'] not in ['questioning', 'define', 'research'] else 
                         'in_progress' if project['current_stage'] == 'research' else 'pending'
            },
            {
                'id': 'create',
                'name': 'Create',
                'status': 'completed' if project['current_stage'] == 'present' else 
                         'in_progress' if project['current_stage'] == 'create' else 'pending'
            },
            {
                'id': 'present',
                'name': 'Present',
                'status': 'in_progress' if project['current_stage'] == 'present' else 'pending'
            }
        ]
        
        # Get milestones
        milestones = find_many(
            PROJECT_MILESTONES,
            {'project_id': project_id},
            sort=[('due_date', 1)]
        )
        
        formatted_milestones = []
        for milestone in milestones:
            formatted_milestones.append({
                'milestone_id': milestone['_id'],
                'title': milestone.get('title'),
                'description': milestone.get('description'),
                'due_date': milestone.get('due_date').isoformat() if milestone.get('due_date') else None,
                'status': milestone.get('status'),
                'completed_at': milestone.get('completed_at').isoformat() if milestone.get('completed_at') else None
            })
        
        # Get teams
        teams = find_many(TEAMS, {'project_id': project_id})
        
        formatted_teams = []
        for team in teams:
            # Get team members
            memberships = find_many(TEAM_MEMBERSHIPS, {'team_id': team['_id']})
            member_ids = [m['student_id'] for m in memberships]
            
            formatted_teams.append({
                'team_id': team['_id'],
                'team_name': team.get('team_name'),
                'member_count': len(member_ids)
            })
        
        return jsonify({
            'project_id': project_id,
            'title': project.get('title'),
            'description': project.get('description'),
            'current_stage': project.get('current_stage'),
            'start_date': project.get('start_date').isoformat() if project.get('start_date') else None,
            'end_date': project.get('end_date').isoformat() if project.get('end_date') else None,
            'stages': stages,
            'milestones': formatted_milestones,
            'teams': formatted_teams
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/projects/<project_id>/stage', methods=['PUT'])
def update_project_stage(project_id):
    """
    BR9: Update project stage
    """
    try:
        data = request.json
        new_stage = data['stage']
        
        update_one(
            PROJECTS,
            {'_id': project_id},
            {'$set': {'current_stage': new_stage}}
        )
        
        return jsonify({'message': 'Project stage updated'}), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/teams', methods=['POST'])
def create_team():
    """
    BR9: Create new team for a project
    """
    try:
        data = request.json
        
        team_doc = {
            '_id': str(ObjectId()),
            'project_id': data['project_id'],
            'team_name': data['team_name'],
            'created_at': datetime.utcnow()
        }
        
        team_id = insert_one(TEAMS, team_doc)
        
        # Add team members if provided
        if 'members' in data:
            for member in data['members']:
                membership_doc = {
                    '_id': str(ObjectId()),
                    'team_id': team_id,
                    'student_id': member['student_id'],
                    'role': member.get('role'),
                    'joined_at': datetime.utcnow()
                }
                insert_one(TEAM_MEMBERSHIPS, membership_doc)
        
        return jsonify({
            'team_id': team_id,
            'message': 'Team created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/teams/<team_id>/members', methods=['POST'])
def add_team_member(team_id):
    """
    BR9: Add member to team
    """
    try:
        data = request.json
        
        # Check if already a member
        existing = find_one(
            TEAM_MEMBERSHIPS,
            {
                'team_id': team_id,
                'student_id': data['student_id']
            }
        )
        
        if existing:
            return jsonify({'error': 'Student already in team'}), 400
        
        membership_doc = {
            '_id': str(ObjectId()),
            'team_id': team_id,
            'student_id': data['student_id'],
            'role': data.get('role'),
            'joined_at': datetime.utcnow()
        }
        
        membership_id = insert_one(TEAM_MEMBERSHIPS, membership_doc)
        
        return jsonify({
            'membership_id': membership_id,
            'message': 'Member added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/milestones', methods=['POST'])
def create_milestone():
    """
    BR9: Create project milestone
    """
    try:
        data = request.json
        
        milestone_doc = {
            '_id': str(ObjectId()),
            'project_id': data['project_id'],
            'team_id': data.get('team_id'),
            'title': data['title'],
            'description': data.get('description'),
            'due_date': datetime.fromisoformat(data['due_date']),
            'status': data.get('status', 'pending'),
            'created_at': datetime.utcnow()
        }
        
        milestone_id = insert_one(PROJECT_MILESTONES, milestone_doc)
        
        return jsonify({
            'milestone_id': milestone_id,
            'message': 'Milestone created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/milestones/<milestone_id>/complete', methods=['POST'])
def complete_milestone(milestone_id):
    """
    BR9: Mark milestone as completed
    """
    try:
        update_one(
            PROJECT_MILESTONES,
            {'_id': milestone_id},
            {
                '$set': {
                    'status': 'completed',
                    'completed_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({'message': 'Milestone marked as completed'}), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


# ============================================================================
# SOFT SKILLS ASSESSMENT ROUTES (BR5) - AI ENGINE INTEGRATED
# ============================================================================

def _convert_to_soft_skill_ratings(ratings_dict: dict) -> SoftSkillRatings:
    """Helper function to convert dict to SoftSkillRatings object"""
    return SoftSkillRatings(
        # Team Dynamics
        td_communication=ratings_dict.get('td_communication', 3.0),
        td_mutual_support=ratings_dict.get('td_mutual_support', 3.0),
        td_trust=ratings_dict.get('td_trust', 3.0),
        td_active_listening=ratings_dict.get('td_active_listening', 3.0),
        # Team Structure
        ts_clear_roles=ratings_dict.get('ts_clear_roles', 3.0),
        ts_task_scheduling=ratings_dict.get('ts_task_scheduling', 3.0),
        ts_decision_making=ratings_dict.get('ts_decision_making', 3.0),
        ts_conflict_resolution=ratings_dict.get('ts_conflict_resolution', 3.0),
        # Team Motivation
        tm_clear_purpose=ratings_dict.get('tm_clear_purpose', 3.0),
        tm_smart_goals=ratings_dict.get('tm_smart_goals', 3.0),
        tm_passion=ratings_dict.get('tm_passion', 3.0),
        tm_synergy=ratings_dict.get('tm_synergy', 3.0),
        # Team Excellence
        te_growth_mindset=ratings_dict.get('te_growth_mindset', 3.0),
        te_quality_work=ratings_dict.get('te_quality_work', 3.0),
        te_self_monitoring=ratings_dict.get('te_self_monitoring', 3.0),
        te_reflective_practice=ratings_dict.get('te_reflective_practice', 3.0)
    )


@pbl_bp.route('/soft-skills/assess', methods=['POST'])
def submit_soft_skill_assessment():
    """
    BR5: Submit peer review or self-assessment with AI validation

    ENHANCED: Now uses SoftSkillsEngine for:
    - Validation of ratings
    - Bias detection
    - Dimension score calculation
    """
    try:
        data = request.get_json(silent=True)
        logger.info(f"Soft skills assessment request | team_id: {data.get('team_id') if data else 'none'} | assessed_student: {data.get('assessed_student_id') if data else 'none'}")
        
        if not data or not isinstance(data, dict):
            return jsonify({'error': 'Invalid or missing JSON body'}), 400
        
        required_fields = ['team_id', 'assessed_student_id', 'ratings']
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            return jsonify({'error': f'Missing required fields: {missing}'}), 400
        
        ratings_dict = data.get('ratings')
        if not isinstance(ratings_dict, dict):
            return jsonify({'error': 'Invalid ratings structure: ratings must be a dictionary'}), 400
        
        # Convert to SoftSkillRatings object
        ratings = _convert_to_soft_skill_ratings(ratings_dict)
        
        # AI Engine: Validate ratings
        validation = soft_skills_engine.validate_ratings(ratings)
        if not validation['valid']:
            return jsonify({
                'error': 'Invalid ratings',
                'detail': 'All ratings must be between 1 and 5',
                'validation': validation
            }), 400
        
        # AI Engine: Check for bias
        bias_check = soft_skills_engine.detect_assessment_bias(
            [ratings],
            [data.get('assessor_student_id', 'anonymous')]
        )
        
        # AI Engine: Calculate dimension scores
        logger.info(f"Calculating dimension scores | team_id: {data['team_id']} | assessed_student: {data['assessed_student_id']}")
        dimension_scores = soft_skills_engine.calculate_dimension_scores(ratings)
        logger.info(f"Soft skills assessed | team_id: {data['team_id']} | assessed_student: {data['assessed_student_id']} | overall_score: {dimension_scores['overall']}")

        # Create assessment document with AI-enhanced data
        assessment_doc = {
            '_id': str(ObjectId()),
            'team_id': data['team_id'],
            'assessed_student_id': data['assessed_student_id'],
            'assessor_student_id': data.get('assessor_student_id'),
            'assessment_type': data.get('assessment_type', 'peer_review'),
            'ratings': ratings_dict,
            
            # AI-calculated scores (0-100 scale)
            'overall_td_score': dimension_scores['TD'],
            'overall_ts_score': dimension_scores['TS'],
            'overall_tm_score': dimension_scores['TM'],
            'overall_te_score': dimension_scores['TE'],
            'overall_score': dimension_scores['overall'],
            
            # AI validation metadata
            'validation': {
                'has_variance': validation['has_variance'],
                'unique_scores': validation['unique_scores'],
                'mean': validation['mean'],
                'std': validation['std']
            },
            
            # AI bias detection
            'bias_flags': bias_check['bias_flags'] if bias_check['has_bias'] else [],
            'has_bias': bias_check['has_bias'],
            
            'comments': data.get('comments'),
            'assessed_at': datetime.utcnow()
        }
        
        assessment_id = insert_one(SOFT_SKILL_ASSESSMENTS, assessment_doc)
        
        return jsonify({
            'assessment_id': assessment_id,
            'team_id': data['team_id'],
            'assessed_student_id': data['assessed_student_id'],
            'dimension_scores': dimension_scores,
            'validation': validation,
            'bias_check': {
                'has_bias': bias_check['has_bias'],
                'bias_count': bias_check['bias_count']
            },
            'assessed_at': assessment_doc['assessed_at'].isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/soft-skills/team/<team_id>/analysis', methods=['GET'])
def get_team_soft_skills_analysis(team_id):
    """
    BR5: Get COMPREHENSIVE team soft skills analysis with AI Engine
    
    ENHANCED: Uses AI Engine for:
    - Multi-rater aggregation (60% peer, 20% self, 20% teacher)
    - Cronbach's Alpha reliability validation
    - Bayesian team success prediction
    - Longitudinal trend analysis
    """
    try:
        # Get all assessments for the team
        assessments = find_many(
            SOFT_SKILL_ASSESSMENTS,
            {'team_id': team_id},
            sort=[('assessed_at', -1)]
        )
        
        if not assessments:
            return jsonify({
                'team_id': team_id,
                'team_name': 'Unknown',
                'has_data': False,
                'message': 'No assessments available for this team'
            }), 200
        
        # Get team name
        team = find_one(TEAMS, {'_id': team_id})
        team_name = team.get('team_name', 'Unknown') if team else 'Unknown'
        
        # Separate assessments by type for multi-rater aggregation
        peer_assessments = []
        self_assessment = None
        teacher_assessment = None
        
        for assessment in assessments:
            ratings = _convert_to_soft_skill_ratings(assessment.get('ratings', {}))
            assessment_type = assessment.get('assessment_type', 'peer_review')
            
            if assessment_type == 'peer_review':
                peer_assessments.append(ratings)
            elif assessment_type == 'self_assessment' and self_assessment is None:
                self_assessment = ratings
            elif assessment_type == 'teacher_assessment' and teacher_assessment is None:
                teacher_assessment = ratings
        
        # AI Engine: Multi-rater aggregation with Cronbach's Alpha
        if peer_assessments:
            aggregated = soft_skills_engine.aggregate_multi_rater_assessments(
                peer_assessments=peer_assessments,
                self_assessment=self_assessment,
                teacher_assessment=teacher_assessment
            )
            
            dimension_scores = aggregated['dimension_scores']
            reliability = aggregated['reliability']
        else:
            # Fallback if no peer assessments
            dimension_scores = {'TD': 0, 'TS': 0, 'TM': 0, 'TE': 0, 'overall': 0}
            reliability = {
                'cronbach_alpha': 0.0,
                'is_reliable': False,
                'peer_count': 0
            }
        
        # AI Engine: Predict team success
        prediction = soft_skills_engine.predict_team_success(dimension_scores)
        
        # AI Engine: Longitudinal trend analysis
        historical_data = []
        for assessment in assessments:
            historical_data.append({
                'dimension_scores': {
                    'TD': assessment.get('overall_td_score', 0),
                    'TS': assessment.get('overall_ts_score', 0),
                    'TM': assessment.get('overall_tm_score', 0),
                    'TE': assessment.get('overall_te_score', 0),
                    'overall': assessment.get('overall_score', 0)
                },
                'timestamp': assessment.get('assessed_at', datetime.utcnow())
            })
        
        trends = soft_skills_engine.analyze_longitudinal_trends(historical_data)
        
        return jsonify({
            'team_id': team_id,
            'team_name': team_name,
            'has_data': True,
            
            # Current scores (0-100 scale)
            'current_scores': dimension_scores,
            
            # Reliability metrics
            'reliability': {
                'cronbach_alpha': reliability['cronbach_alpha'],
                'is_reliable': reliability['is_reliable'],
                'interpretation': (
                    'Excellent reliability' if reliability['cronbach_alpha'] >= 0.9 else
                    'Good reliability' if reliability['cronbach_alpha'] >= 0.8 else
                    'Acceptable reliability' if reliability['cronbach_alpha'] >= 0.7 else
                    'Questionable reliability'
                ),
                'peer_count': reliability['peer_count'],
                'has_self_assessment': reliability.get('has_self', False),
                'has_teacher_assessment': reliability.get('has_teacher', False)
            },
            
            # Team success prediction
            'prediction': {
                'success_probability': prediction['success_probability'],
                'confidence_level': prediction['confidence_level'],
                'strengths': prediction['strengths'],
                'weaknesses': prediction['weaknesses'],
                'top_recommendations': prediction['recommendations'][:5]
            },
            
            # Longitudinal trends
            'trends': {
                'trajectory': trends['trend'],
                'improvement_rate': trends['improvement_rate'],
                'percent_change': trends['percent_change'],
                'dimension_trends': trends['dimension_trends'],
                'assessment_count': trends['assessment_count'],
                'time_span_days': trends['time_span_days']
            },
            
            'assessment_count': len(assessments)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/soft-skills/student/<student_id>', methods=['GET'])
def get_student_soft_skills(student_id):
    """
    BR5: Get soft skill assessments for a student
    """
    try:
        team_id = request.args.get('team_id')
        
        query = {'assessed_student_id': student_id}
        if team_id:
            query['team_id'] = team_id
        
        assessments = find_many(
            SOFT_SKILL_ASSESSMENTS,
            query,
            sort=[('assessed_at', -1)]
        )
        
        formatted_assessments = []
        for assessment in assessments:
            formatted_assessments.append({
                'assessment_id': assessment['_id'],
                'team_id': assessment.get('team_id'),
                'assessment_type': assessment.get('assessment_type'),
                'overall_td_score': assessment.get('overall_td_score'),
                'overall_ts_score': assessment.get('overall_ts_score'),
                'overall_tm_score': assessment.get('overall_tm_score'),
                'overall_te_score': assessment.get('overall_te_score'),
                'overall_score': assessment.get('overall_score'),
                'has_bias': assessment.get('has_bias', False),
                'bias_flags': assessment.get('bias_flags', []),
                'comments': assessment.get('comments'),
                'assessed_at': assessment.get('assessed_at').isoformat() if assessment.get('assessed_at') else None
            })
        
        return jsonify({
            'student_id': student_id,
            'assessments': formatted_assessments,
            'total_assessments': len(assessments)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/soft-skills/rubric', methods=['GET'])
def get_peer_review_rubric():
    """
    BR5: Generate structured peer review rubric using AI Engine
    
    NEW ENDPOINT: Returns a complete rubric for students to fill out
    """
    try:
        student_name = request.args.get('student_name', 'Your Teammate')
        team_name = request.args.get('team_name', 'Your Team')
        
        # AI Engine: Generate rubric
        rubric = soft_skills_engine.generate_peer_review_rubric(
            student_name=student_name,
            team_name=team_name
        )
        
        return jsonify(rubric), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/artifacts', methods=['POST'])
def upload_artifact():
    """
    BR9: Upload project artifact
    """
    try:
        data = request.json
        
        # Get current version for this artifact type
        existing_artifacts = find_many(
            PROJECT_ARTIFACTS,
            {
                'team_id': data['team_id'],
                'artifact_type': data['artifact_type']
            }
        )
        version = len(existing_artifacts) + 1
        
        artifact_doc = {
            '_id': str(ObjectId()),
            'team_id': data['team_id'],
            'project_id': data['project_id'],
            'artifact_type': data['artifact_type'],
            'file_name': data['file_name'],
            'file_url': data['file_url'],
            'uploaded_by': data['uploaded_by'],
            'version': version,
            'uploaded_at': datetime.utcnow()
        }
        
        artifact_id = insert_one(PROJECT_ARTIFACTS, artifact_doc)
        
        return jsonify({
            'artifact_id': artifact_id,
            'version': version,
            'message': 'Artifact uploaded successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500


@pbl_bp.route('/artifacts/team/<team_id>', methods=['GET'])
def get_team_artifacts(team_id):
    """
    BR9: Get all artifacts for a team
    """
    try:
        artifacts = find_many(
            PROJECT_ARTIFACTS,
            {'team_id': team_id},
            sort=[('uploaded_at', -1)]
        )
        
        formatted_artifacts = []
        for artifact in artifacts:
            formatted_artifacts.append({
                'artifact_id': artifact['_id'],
                'artifact_type': artifact.get('artifact_type'),
                'file_name': artifact.get('file_name'),
                'file_url': artifact.get('file_url'),
                'version': artifact.get('version'),
                'uploaded_by': artifact.get('uploaded_by'),
                'uploaded_at': artifact.get('uploaded_at').isoformat() if artifact.get('uploaded_at') else None
            })
        
        return jsonify(formatted_artifacts), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'detail': str(e)
        }), 500
