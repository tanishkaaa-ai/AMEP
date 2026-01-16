from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid

pbl_bp = Blueprint('pbl', __name__)

# ============================================================================
# PBL ROUTES (BR5, BR9)
# ============================================================================

@pbl_bp.route('/projects', methods=['GET'])
def list_projects():
    """
    BR9: Get all projects for a teacher or student
    """
    try:
        teacher_id = request.args.get('teacher_id')
        student_id = request.args.get('student_id')
        
        # Mock data
        projects = [
            {
                'project_id': 'p1',
                'title': 'Sustainable Energy Solutions',
                'current_stage': 'research',
                'start_date': '2025-01-06',
                'end_date': '2025-02-14',
                'team_count': 3,
                'status': 'on_track'
            }
        ]
        
        return jsonify(projects), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pbl_bp.route('/projects/<project_id>', methods=['GET'])
def get_project_details(project_id):
    """
    BR9: Get detailed project information
    """
    try:
        # Mock data
        project = {
            'project_id': project_id,
            'title': 'Sustainable Energy Solutions',
            'description': 'Design renewable energy solutions',
            'current_stage': 'research',
            'stages': [
                {'id': 'questioning', 'name': 'Questioning', 'status': 'completed'},
                {'id': 'define', 'name': 'Define', 'status': 'completed'},
                {'id': 'research', 'name': 'Research', 'status': 'in_progress'},
                {'id': 'create', 'name': 'Create', 'status': 'pending'},
                {'id': 'present', 'name': 'Present', 'status': 'pending'}
            ],
            'milestones': [
                {
                    'milestone_id': 'm1',
                    'title': 'Research Report',
                    'due_date': '2025-01-20',
                    'status': 'in_progress'
                }
            ],
            'teams': []
        }
        
        return jsonify(project), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pbl_bp.route('/soft-skills/assess', methods=['POST'])
def submit_soft_skill_assessment():
    """
    BR5: Submit peer review or self-assessment
    
    Request body:
    {
        "team_id": "uuid",
        "assessed_student_id": "uuid",
        "assessor_student_id": "uuid",
        "assessment_type": "peer_review",
        "ratings": {
            "td_communication": 4.0,
            "td_mutual_support": 4.5,
            ...
        }
    }
    """
    try:
        data = request.json
        
        def calculate_average(values):
            valid = [v for v in values if v > 0]
            return sum(valid) / len(valid) if valid else 0
        
        # Calculate dimension averages
        ratings = data['ratings']
        td_avg = calculate_average([
            ratings.get('td_communication', 0),
            ratings.get('td_mutual_support', 0),
            ratings.get('td_trust', 0),
            ratings.get('td_active_listening', 0)
        ])
        
        ts_avg = calculate_average([
            ratings.get('ts_clear_roles', 0),
            ratings.get('ts_task_scheduling', 0),
            ratings.get('ts_decision_making', 0),
            ratings.get('ts_conflict_resolution', 0)
        ])
        
        tm_avg = calculate_average([
            ratings.get('tm_clear_purpose', 0),
            ratings.get('tm_smart_goals', 0),
            ratings.get('tm_passion', 0),
            ratings.get('tm_synergy', 0)
        ])
        
        te_avg = calculate_average([
            ratings.get('te_growth_mindset', 0),
            ratings.get('te_quality_work', 0),
            ratings.get('te_self_monitoring', 0),
            ratings.get('te_reflective_practice', 0)
        ])
        
        assessment = {
            'assessment_id': str(uuid.uuid4()),
            'team_id': data['team_id'],
            'assessed_student_id': data['assessed_student_id'],
            'overall_td_score': round(td_avg, 2),
            'overall_ts_score': round(ts_avg, 2),
            'overall_tm_score': round(tm_avg, 2),
            'overall_te_score': round(te_avg, 2),
            'overall_score': round((td_avg + ts_avg + tm_avg + te_avg) / 4, 2),
            'assessed_at': datetime.now().isoformat()
        }
        
        return jsonify(assessment), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pbl_bp.route('/soft-skills/team/<team_id>', methods=['GET'])
def get_team_soft_skills(team_id):
    """
    BR5: Get aggregated soft skill scores for a team
    """
    try:
        # Mock data
        team_scores = {
            'team_id': team_id,
            'team_name': 'Team Alpha',
            'current_scores': {
                'td': 4.2,
                'ts': 3.8,
                'tm': 4.5,
                'te': 4.0
            },
            'trend_data': [
                {'week': 'Week 1', 'td': 3.2, 'ts': 3.0, 'tm': 3.5, 'te': 3.3},
                {'week': 'Week 2', 'td': 3.8, 'ts': 3.2, 'tm': 4.0, 'te': 3.6},
                {'week': 'Week 3', 'td': 4.0, 'ts': 3.5, 'tm': 4.2, 'te': 3.8},
                {'week': 'Week 4', 'td': 4.2, 'ts': 3.8, 'tm': 4.5, 'te': 4.0}
            ],
            'assessment_count': 12
        }
        
        return jsonify(team_scores), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
