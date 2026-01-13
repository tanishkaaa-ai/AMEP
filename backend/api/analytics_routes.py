from flask import request, jsonify
from datetime import datetime
import uuid

from app import app
# ============================================================================
# TEACHER PRODUCTIVITY ROUTES (BR7, BR8)
# ============================================================================

@app.route('/api/templates', methods=['GET'])
def list_templates():
    """
    BR7: Get curriculum-aligned templates
    """
    try:
        subject_area = request.args.get('subject_area')
        grade_level = request.args.get('grade_level')
        
        # Mock data
        templates = [
            {
                'template_id': 't1',
                'title': 'Ecosystem Investigation Project',
                'subject_area': 'Science',
                'grade_level': 7,
                'template_type': 'project_brief',
                'learning_objectives': ['Understand ecosystem dynamics'],
                'estimated_duration': 180,
                'times_used': 45,
                'avg_rating': 4.6
            }
        ]
        
        return jsonify(templates), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/unified', methods=['GET'])
def get_unified_analytics():
    """
    BR8: Get unified institutional metrics
    """
    try:
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        # Mock data
        metrics = {
            'metric_date': date,
            'mastery_rate': 78.5,
            'teacher_adoption_rate': 92.3,
            'admin_confidence_score': 94.1,
            'total_students': 450,
            'active_students': 432,
            'total_teachers': 28,
            'active_teachers': 26,
            'avg_engagement_score': 87.2,
            'avg_planning_time_minutes': 45.0,  # Down from 180
            'data_entry_events': 3  # Down from 6
        }
        
        return jsonify(metrics), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/interventions/track', methods=['POST'])
def track_intervention():
    """
    BR6: Track teacher intervention and measure impact
    
    Request body:
    {
        "teacher_id": "uuid",
        "concept_id": "uuid",
        "intervention_type": string,
        "target_students": [uuid],
        "mastery_before": float
    }
    """
    try:
        data = request.json
        
        intervention = {
            'intervention_id': str(uuid.uuid4()),
            'teacher_id': data['teacher_id'],
            'concept_id': data['concept_id'],
            'intervention_type': data['intervention_type'],
            'target_students': data['target_students'],
            'mastery_before': data['mastery_before'],
            'performed_at': datetime.now().isoformat()
        }
        
        return jsonify(intervention), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
