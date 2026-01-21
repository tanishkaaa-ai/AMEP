/**
 * AMEP Classroom Management Schema
 * Google Classroom-like functionality for AMEP
 *
 * Collections:
 * - classrooms: Main classroom data
 * - classroom_memberships: Student-classroom associations
 * - classroom_posts: Announcements, assignments, materials
 * - classroom_comments: Comments on posts
 * - classroom_assignments: Assignment details with submissions
 *
 * Location: database/classrooms_schema.js
 */

db = db.getSiblingDB('amep');

// ============================================================================
// CLASSROOMS COLLECTION
// ============================================================================

db.createCollection('classrooms', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['teacher_id', 'class_name', 'join_code', 'created_at'],
            properties: {
                _id: { bsonType: 'string' },
                teacher_id: { bsonType: 'string', description: 'Reference to teachers._id' },
                class_name: { bsonType: 'string', minLength: 1, maxLength: 100 },
                section: { bsonType: 'string', maxLength: 50 },
                subject: { bsonType: 'string', maxLength: 100 },
                room: { bsonType: 'string', maxLength: 50 },
                description: { bsonType: 'string', maxLength: 1000 },
                join_code: { bsonType: 'string', pattern: '^[A-Z0-9]{6}$', description: '6-character alphanumeric code' },
                is_active: { bsonType: 'bool' },
                theme_color: { bsonType: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
                grade_level: { bsonType: 'int', minimum: 1, maximum: 12 },
                max_students: { bsonType: 'int', minimum: 1 },
                settings: {
                    bsonType: 'object',
                    properties: {
                        allow_student_posts: { bsonType: 'bool' },
                        allow_student_comments: { bsonType: 'bool' },
                        show_class_code: { bsonType: 'bool' },
                        enable_notifications: { bsonType: 'bool' }
                    }
                },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' },
                archived_at: { bsonType: ['date', 'null'] }
            }
        }
    }
});

// Indexes for classrooms
db.classrooms.createIndex({ teacher_id: 1 });
db.classrooms.createIndex({ join_code: 1 }, { unique: true });
db.classrooms.createIndex({ is_active: 1 });
db.classrooms.createIndex({ created_at: -1 });

print('✓ Classrooms collection created with validation rules');


// ============================================================================
// CLASSROOM_MEMBERSHIPS COLLECTION
// ============================================================================

db.createCollection('classroom_memberships', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['classroom_id', 'student_id', 'joined_at'],
            properties: {
                _id: { bsonType: 'string' },
                classroom_id: { bsonType: 'string', description: 'Reference to classrooms._id' },
                student_id: { bsonType: 'string', description: 'Reference to students._id' },
                role: { enum: ['student', 'co_teacher'], description: 'Member role in classroom' },
                is_active: { bsonType: 'bool' },
                joined_at: { bsonType: 'date' },
                left_at: { bsonType: ['date', 'null'] },
                muted: { bsonType: 'bool', description: 'Student has notifications muted' }
            }
        }
    }
});

// Indexes for classroom_memberships
db.classroom_memberships.createIndex({ classroom_id: 1, student_id: 1 }, { unique: true });
db.classroom_memberships.createIndex({ student_id: 1 });
db.classroom_memberships.createIndex({ classroom_id: 1, is_active: 1 });

print('✓ Classroom_memberships collection created with validation rules');


// ============================================================================
// CLASSROOM_POSTS COLLECTION
// ============================================================================

db.createCollection('classroom_posts', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['classroom_id', 'author_id', 'post_type', 'created_at'],
            properties: {
                _id: { bsonType: 'string' },
                classroom_id: { bsonType: 'string', description: 'Reference to classrooms._id' },
                author_id: { bsonType: 'string', description: 'Reference to users._id' },
                author_role: { enum: ['teacher', 'student'], description: 'Role of post author' },
                post_type: { enum: ['announcement', 'assignment', 'material', 'question'], description: 'Type of post' },
                title: { bsonType: 'string', maxLength: 200 },
                content: { bsonType: 'string', maxLength: 5000 },
                attachments: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        properties: {
                            file_name: { bsonType: 'string' },
                            file_url: { bsonType: 'string' },
                            file_type: { bsonType: 'string' },
                            file_size: { bsonType: 'int' }
                        }
                    }
                },
                assignment_details: {
                    bsonType: ['object', 'null'],
                    properties: {
                        due_date: { bsonType: 'date' },
                        points: { bsonType: 'int' },
                        allow_late_submission: { bsonType: 'bool' },
                        grading_rubric: { bsonType: 'object' }
                    }
                },
                is_pinned: { bsonType: 'bool' },
                comment_count: { bsonType: 'int', minimum: 0 },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' },
                scheduled_at: { bsonType: ['date', 'null'] },
                published: { bsonType: 'bool' }
            }
        }
    }
});

// Indexes for classroom_posts
db.classroom_posts.createIndex({ classroom_id: 1, created_at: -1 });
db.classroom_posts.createIndex({ author_id: 1 });
db.classroom_posts.createIndex({ post_type: 1 });
db.classroom_posts.createIndex({ is_pinned: -1, created_at: -1 });

print('✓ Classroom_posts collection created with validation rules');


// ============================================================================
// CLASSROOM_COMMENTS COLLECTION
// ============================================================================

db.createCollection('classroom_comments', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['post_id', 'author_id', 'content', 'created_at'],
            properties: {
                _id: { bsonType: 'string' },
                post_id: { bsonType: 'string', description: 'Reference to classroom_posts._id' },
                author_id: { bsonType: 'string', description: 'Reference to users._id' },
                author_role: { enum: ['teacher', 'student'], description: 'Role of comment author' },
                content: { bsonType: 'string', maxLength: 2000 },
                attachments: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        properties: {
                            file_name: { bsonType: 'string' },
                            file_url: { bsonType: 'string' }
                        }
                    }
                },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' }
            }
        }
    }
});

// Indexes for classroom_comments
db.classroom_comments.createIndex({ post_id: 1, created_at: 1 });
db.classroom_comments.createIndex({ author_id: 1 });

print('✓ Classroom_comments collection created with validation rules');


// ============================================================================
// CLASSROOM_SUBMISSIONS COLLECTION
// ============================================================================

db.createCollection('classroom_submissions', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['assignment_id', 'student_id', 'status'],
            properties: {
                _id: { bsonType: 'string' },
                assignment_id: { bsonType: 'string', description: 'Reference to classroom_posts._id (assignment type)' },
                student_id: { bsonType: 'string', description: 'Reference to students._id' },
                status: { enum: ['assigned', 'turned_in', 'graded', 'returned'], description: 'Submission status' },
                submission_text: { bsonType: 'string', maxLength: 10000 },
                attachments: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        properties: {
                            file_name: { bsonType: 'string' },
                            file_url: { bsonType: 'string' },
                            file_type: { bsonType: 'string' },
                            uploaded_at: { bsonType: 'date' }
                        }
                    }
                },
                grade: { bsonType: ['int', 'null'], minimum: 0 },
                teacher_feedback: { bsonType: 'string', maxLength: 2000 },
                submitted_at: { bsonType: ['date', 'null'] },
                graded_at: { bsonType: ['date', 'null'] },
                returned_at: { bsonType: ['date', 'null'] },
                is_late: { bsonType: 'bool' },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' }
            }
        }
    }
});

// Indexes for classroom_submissions
db.classroom_submissions.createIndex({ assignment_id: 1, student_id: 1 }, { unique: true });
db.classroom_submissions.createIndex({ student_id: 1, status: 1 });
db.classroom_submissions.createIndex({ assignment_id: 1, status: 1 });

print('✓ Classroom_submissions collection created with validation rules');


// ============================================================================
// CLASSROOM_NOTIFICATIONS COLLECTION
// ============================================================================

db.createCollection('classroom_notifications', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['user_id', 'classroom_id', 'notification_type', 'created_at'],
            properties: {
                _id: { bsonType: 'string' },
                user_id: { bsonType: 'string', description: 'Reference to users._id' },
                classroom_id: { bsonType: 'string', description: 'Reference to classrooms._id' },
                notification_type: {
                    enum: ['new_post', 'new_comment', 'assignment_due', 'grade_posted', 'student_joined'],
                    description: 'Type of notification'
                },
                title: { bsonType: 'string', maxLength: 200 },
                message: { bsonType: 'string', maxLength: 500 },
                link: { bsonType: 'string' },
                is_read: { bsonType: 'bool' },
                created_at: { bsonType: 'date' },
                read_at: { bsonType: ['date', 'null'] }
            }
        }
    }
});

// Indexes for classroom_notifications
db.classroom_notifications.createIndex({ user_id: 1, is_read: 1, created_at: -1 });
db.classroom_notifications.createIndex({ classroom_id: 1 });

print('✓ Classroom_notifications collection created with validation rules');

print('\n========================================');
print('✓ All classroom collections created successfully!');
print('========================================\n');
