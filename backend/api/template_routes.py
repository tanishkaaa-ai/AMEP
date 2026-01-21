"""
AMEP Curriculum Template Repository
Searchable library of ready-to-use project templates and assessment frameworks

Solves: BR7 (Workload Reduction)

Research Sources:
- Paper 14.pdf: Workload Challenge Research Projects
- Paper 15.pdf: Unit Plans Save 3 Hours/Week

Key Features:
- Curriculum-aligned templates
- Grade level and subject filtering
- Assessment rubrics included
- Collaborative sharing
- Ready-to-use project briefs
- Reduces planning time by ~3 hours/week (research-validated)

Location: backend/api/template_routes.py
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId

# Import MongoDB helpers
from models.database import (
    db,
    find_one,
    find_many,
    insert_one,
    update_one,
    delete_one,
    count_documents,
    CURRICULUM_TEMPLATES,
    TEACHERS
)

# Import logging
from utils.logger import get_logger

template_bp = Blueprint('templates', __name__)
logger = get_logger(__name__)


# ============================================================================
# TEMPLATE MANAGEMENT ROUTES
# ============================================================================

@template_bp.route('/templates', methods=['POST'])
def create_template():
    """
    Create a new curriculum template

    BR7: Teachers can share templates to reduce workload

    Request body:
    {
        "teacher_id": "teacher_user_id",
        "title": "Ecosystem Investigation Project",
        "description": "Students investigate local ecosystems...",
        "subject_area": "Science",
        "grade_level": 7,
        "template_type": "project|lesson|assessment|activity",
        "duration_weeks": 3,
        "learning_objectives": ["Understand ecosystems", "..."],
        "materials_needed": ["Notebooks", "Camera", "..."],
        "assessment_rubric": {...},
        "soft_skills_targeted": ["Collaboration", "Research"],
        "curriculum_standards": ["NGSS.MS-LS2-1", "..."],
        "resources": [{"name": "...", "url": "..."}],
        "is_public": true
    }
    """
    try:
        data = request.json
        logger.info(f"Create template request | teacher: {data.get('teacher_id')} | title: {data.get('title')}")

        # Validate required fields
        required = ['teacher_id', 'title', 'subject_area', 'grade_level', 'template_type']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {missing}'}), 400

        # Validate template type
        valid_types = ['project', 'lesson', 'assessment', 'activity', 'unit_plan']
        if data['template_type'] not in valid_types:
            return jsonify({'error': f'template_type must be one of: {valid_types}'}), 400

        template_doc = {
            '_id': str(ObjectId()),
            'teacher_id': data['teacher_id'],
            'title': data['title'],
            'description': data.get('description', ''),
            'subject_area': data['subject_area'],
            'grade_level': int(data['grade_level']),
            'template_type': data['template_type'],
            'duration_weeks': data.get('duration_weeks', 1),
            'estimated_hours': data.get('estimated_hours', 10),

            # Learning content
            'learning_objectives': data.get('learning_objectives', []),
            'key_concepts': data.get('key_concepts', []),
            'materials_needed': data.get('materials_needed', []),
            'prerequisites': data.get('prerequisites', []),

            # Assessment
            'assessment_rubric': data.get('assessment_rubric', {}),
            'assessment_methods': data.get('assessment_methods', []),

            # Skills
            'soft_skills_targeted': data.get('soft_skills_targeted', []),
            'hard_skills_targeted': data.get('hard_skills_targeted', []),

            # Standards alignment
            'curriculum_standards': data.get('curriculum_standards', []),
            'competencies': data.get('competencies', []),

            # Resources
            'resources': data.get('resources', []),
            'sample_artifacts': data.get('sample_artifacts', []),
            'instructional_notes': data.get('instructional_notes', ''),

            # Sharing
            'is_public': data.get('is_public', False),
            'is_verified': False,  # Admin verification
            'tags': data.get('tags', []),

            # Usage stats
            'usage_count': 0,
            'rating': 0.0,
            'rating_count': 0,

            # Metadata
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'version': 1
        }

        template_id = insert_one(CURRICULUM_TEMPLATES, template_doc)
        logger.info(f"Template created | template_id: {template_id} | type: {data['template_type']}")

        return jsonify({
            'template_id': template_id,
            'message': 'Template created successfully'
        }), 201

    except Exception as e:
        logger.info(f"Create template exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@template_bp.route('/templates/search', methods=['GET'])
def search_templates():
    """
    Search curriculum templates

    BR7: Searchable repository reduces planning time

    Query parameters:
    - subject: Filter by subject area
    - grade_level: Filter by grade
    - template_type: Filter by type
    - q: Text search in title/description
    - tags: Comma-separated tags
    - limit: Number of results (default 20)
    - offset: Pagination offset
    """
    try:
        # Build query
        query = {'is_public': True}

        # Subject filter
        if request.args.get('subject'):
            query['subject_area'] = request.args.get('subject')

        # Grade level filter
        if request.args.get('grade_level'):
            query['grade_level'] = int(request.args.get('grade_level'))

        # Template type filter
        if request.args.get('template_type'):
            query['template_type'] = request.args.get('template_type')

        # Tags filter
        if request.args.get('tags'):
            tags = request.args.get('tags').split(',')
            query['tags'] = {'$in': tags}

        # Text search
        text_query = request.args.get('q')
        if text_query:
            # MongoDB text search (requires text index)
            query['$text'] = {'$search': text_query}

        # Pagination
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))

        logger.info(f"Template search | query: {query} | limit: {limit}")

        # Execute search
        templates = find_many(
            CURRICULUM_TEMPLATES,
            query,
            sort=[('usage_count', -1), ('rating', -1)]
        )[offset:offset+limit]

        # Format results
        formatted_templates = []
        for template in templates:
            # Get teacher info
            teacher = find_one(TEACHERS, {'_id': template['teacher_id']})

            formatted_templates.append({
                'template_id': template['_id'],
                'title': template.get('title'),
                'description': template.get('description'),
                'subject_area': template.get('subject_area'),
                'grade_level': template.get('grade_level'),
                'template_type': template.get('template_type'),
                'duration_weeks': template.get('duration_weeks'),
                'estimated_hours': template.get('estimated_hours'),
                'learning_objectives': template.get('learning_objectives', []),
                'soft_skills_targeted': template.get('soft_skills_targeted', []),
                'usage_count': template.get('usage_count', 0),
                'rating': template.get('rating', 0.0),
                'tags': template.get('tags', []),
                'author': {
                    'name': f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}" if teacher else 'Unknown',
                    'school': teacher.get('school') if teacher else None
                } if teacher else None,
                'created_at': template.get('created_at').isoformat() if template.get('created_at') else None
            })

        total_count = count_documents(CURRICULUM_TEMPLATES, query)

        logger.info(f"Template search results | found: {len(formatted_templates)} | total: {total_count}")

        return jsonify({
            'templates': formatted_templates,
            'total': total_count,
            'limit': limit,
            'offset': offset
        }), 200

    except Exception as e:
        logger.info(f"Search templates exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@template_bp.route('/templates/<template_id>', methods=['GET'])
def get_template(template_id):
    """
    Get complete template details

    BR7: Ready-to-use templates with all materials included
    """
    try:
        logger.info(f"Get template | template_id: {template_id}")

        template = find_one(CURRICULUM_TEMPLATES, {'_id': template_id})
        if not template:
            return jsonify({'error': 'Template not found'}), 404

        # Increment usage count
        update_one(
            CURRICULUM_TEMPLATES,
            {'_id': template_id},
            {'$inc': {'usage_count': 1}}
        )

        # Get teacher info
        teacher = find_one(TEACHERS, {'_id': template['teacher_id']})

        return jsonify({
            'template_id': template['_id'],
            'title': template.get('title'),
            'description': template.get('description'),
            'subject_area': template.get('subject_area'),
            'grade_level': template.get('grade_level'),
            'template_type': template.get('template_type'),
            'duration_weeks': template.get('duration_weeks'),
            'estimated_hours': template.get('estimated_hours'),

            # Learning content
            'learning_objectives': template.get('learning_objectives', []),
            'key_concepts': template.get('key_concepts', []),
            'materials_needed': template.get('materials_needed', []),
            'prerequisites': template.get('prerequisites', []),

            # Assessment
            'assessment_rubric': template.get('assessment_rubric', {}),
            'assessment_methods': template.get('assessment_methods', []),

            # Skills
            'soft_skills_targeted': template.get('soft_skills_targeted', []),
            'hard_skills_targeted': template.get('hard_skills_targeted', []),

            # Standards
            'curriculum_standards': template.get('curriculum_standards', []),
            'competencies': template.get('competencies', []),

            # Resources
            'resources': template.get('resources', []),
            'sample_artifacts': template.get('sample_artifacts', []),
            'instructional_notes': template.get('instructional_notes', ''),

            # Metadata
            'tags': template.get('tags', []),
            'usage_count': template.get('usage_count', 0),
            'rating': template.get('rating', 0.0),
            'rating_count': template.get('rating_count', 0),
            'author': {
                'teacher_id': teacher.get('_id') if teacher else None,
                'name': f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}" if teacher else 'Unknown',
                'school': teacher.get('school') if teacher else None
            } if teacher else None,
            'created_at': template.get('created_at').isoformat() if template.get('created_at') else None,
            'version': template.get('version', 1)
        }), 200

    except Exception as e:
        logger.info(f"Get template exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@template_bp.route('/templates/<template_id>/rate', methods=['POST'])
def rate_template(template_id):
    """
    Rate a template (1-5 stars)

    Request body:
    {
        "teacher_id": "teacher_user_id",
        "rating": 5,
        "review": "Very helpful template!"  // Optional
    }
    """
    try:
        data = request.json
        logger.info(f"Rate template | template_id: {template_id} | rating: {data.get('rating')}")

        if not data.get('teacher_id') or not data.get('rating'):
            return jsonify({'error': 'teacher_id and rating are required'}), 400

        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400

        template = find_one(CURRICULUM_TEMPLATES, {'_id': template_id})
        if not template:
            return jsonify({'error': 'Template not found'}), 404

        # Calculate new average rating
        current_rating = template.get('rating', 0.0)
        current_count = template.get('rating_count', 0)

        new_count = current_count + 1
        new_rating = ((current_rating * current_count) + rating) / new_count

        # Update template
        update_one(
            CURRICULUM_TEMPLATES,
            {'_id': template_id},
            {
                '$set': {
                    'rating': round(new_rating, 2),
                    'rating_count': new_count
                }
            }
        )

        logger.info(f"Template rated | template_id: {template_id} | new_rating: {new_rating:.2f}")

        return jsonify({
            'message': 'Rating submitted successfully',
            'new_rating': round(new_rating, 2),
            'rating_count': new_count
        }), 200

    except Exception as e:
        logger.info(f"Rate template exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@template_bp.route('/teachers/<teacher_id>/templates', methods=['GET'])
def get_teacher_templates(teacher_id):
    """Get all templates created by a teacher"""
    try:
        logger.info(f"Get teacher templates | teacher_id: {teacher_id}")

        include_private = request.args.get('include_private') == 'true'

        query = {'teacher_id': teacher_id}
        if not include_private:
            query['is_public'] = True

        templates = find_many(
            CURRICULUM_TEMPLATES,
            query,
            sort=[('created_at', -1)]
        )

        formatted = []
        for template in templates:
            formatted.append({
                'template_id': template['_id'],
                'title': template.get('title'),
                'template_type': template.get('template_type'),
                'subject_area': template.get('subject_area'),
                'grade_level': template.get('grade_level'),
                'is_public': template.get('is_public'),
                'usage_count': template.get('usage_count', 0),
                'rating': template.get('rating', 0.0),
                'created_at': template.get('created_at').isoformat() if template.get('created_at') else None
            })

        logger.info(f"Teacher templates retrieved | teacher_id: {teacher_id} | count: {len(formatted)}")
        return jsonify(formatted), 200

    except Exception as e:
        logger.info(f"Get teacher templates exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


@template_bp.route('/templates/popular', methods=['GET'])
def get_popular_templates():
    """
    Get most popular templates

    BR7: Highlights best templates to save teacher time
    """
    try:
        limit = int(request.args.get('limit', 10))

        templates = find_many(
            CURRICULUM_TEMPLATES,
            {'is_public': True, 'is_verified': True},
            sort=[('usage_count', -1), ('rating', -1)]
        )[:limit]

        formatted = []
        for template in templates:
            teacher = find_one(TEACHERS, {'_id': template['teacher_id']})

            formatted.append({
                'template_id': template['_id'],
                'title': template.get('title'),
                'description': template.get('description'),
                'subject_area': template.get('subject_area'),
                'grade_level': template.get('grade_level'),
                'template_type': template.get('template_type'),
                'usage_count': template.get('usage_count', 0),
                'rating': template.get('rating', 0.0),
                'author_name': f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}" if teacher else 'Unknown'
            })

        logger.info(f"Popular templates retrieved | count: {len(formatted)}")
        return jsonify(formatted), 200

    except Exception as e:
        logger.info(f"Get popular templates exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


# ============================================================================
# PRE-LOADED SAMPLE TEMPLATES
# ============================================================================

SAMPLE_TEMPLATES = [
    {
        "title": "Ecosystem Investigation Project",
        "description": "Students investigate local ecosystems through field research and data collection",
        "subject_area": "Science",
        "grade_level": 7,
        "template_type": "project",
        "duration_weeks": 3,
        "learning_objectives": [
            "Understand ecosystem components and interactions",
            "Collect and analyze field data",
            "Present scientific findings"
        ],
        "soft_skills_targeted": ["Collaboration", "Research", "Presentation"],
        "curriculum_standards": ["NGSS.MS-LS2-1", "NGSS.MS-LS2-2"],
        "tags": ["science", "ecology", "field_work", "pbl"]
    },
    {
        "title": "Statistics in Sports",
        "description": "Apply statistical concepts through analysis of sports data",
        "subject_area": "Mathematics",
        "grade_level": 8,
        "template_type": "project",
        "duration_weeks": 2,
        "learning_objectives": [
            "Calculate mean, median, mode from real data",
            "Create data visualizations",
            "Make predictions using statistics"
        ],
        "soft_skills_targeted": ["Data analysis", "Critical thinking"],
        "tags": ["math", "statistics", "sports", "data"]
    },
    {
        "title": "Podcast Creation Project",
        "description": "Students research, script, and produce educational podcasts",
        "subject_area": "English",
        "grade_level": 9,
        "template_type": "project",
        "duration_weeks": 4,
        "learning_objectives": [
            "Research and synthesize information",
            "Write effective scripts",
            "Practice public speaking and audio production"
        ],
        "soft_skills_targeted": ["Communication", "Creativity", "Technology"],
        "tags": ["english", "media", "speaking", "technology"]
    }
]


@template_bp.route('/templates/seed', methods=['POST'])
def seed_sample_templates():
    """Admin endpoint to seed sample templates"""
    try:
        teacher_id = request.json.get('teacher_id', 'admin_teacher')

        created = []
        for sample in SAMPLE_TEMPLATES:
            template_doc = {
                '_id': str(ObjectId()),
                'teacher_id': teacher_id,
                **sample,
                'is_public': True,
                'is_verified': True,
                'usage_count': 0,
                'rating': 4.5,
                'rating_count': 10,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            template_id = insert_one(CURRICULUM_TEMPLATES, template_doc)
            created.append(template_id)

        logger.info(f"Seeded {len(created)} sample templates")
        return jsonify({
            'message': f'Seeded {len(created)} sample templates',
            'template_ids': created
        }), 201

    except Exception as e:
        logger.info(f"Seed templates exception | error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("AMEP Curriculum Template Repository")
    print("=" * 60)
    print("\nBR7: Reduces teacher planning time by ~3 hours/week")
    print("\nKey Features:")
    print("✓ Searchable template library")
    print("✓ Curriculum-aligned content")
    print("✓ Assessment rubrics included")
    print("✓ Collaborative sharing")
    print("✓ Rating system for quality")
    print("\nResearch-validated time savings!")
    print("=" * 60)
