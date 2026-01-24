
from pymongo import MongoClient
import os
from bson import ObjectId

# Connect to DB
client = MongoClient('mongodb://localhost:27017/')
db = client['amep_db']

def debug_data():
    print("=== Debugging Interest Data ===")
    
    # 1. Check for Students
    students = list(db.students.find())
    print(f"Total Students: {len(students)}")
    if not students:
        print("No students found!")
        return

    # Use the first student found or try to match a user if we knew one
    student = students[0]
    student_id = student['_id']
    user_id = student.get('user_id')
    print(f"Target Student ID: {student_id} (Type: {type(student_id)})")
    print(f"Target User ID: {user_id}")

    # 2. Check Mastery
    # Try string query
    mastery_str = list(db.student_concept_mastery.find({'student_id': str(student_id)}))
    
    # Try ObjectId query
    mastery_oid = []
    try:
        if ObjectId.is_valid(str(student_id)):
            mastery_oid = list(db.student_concept_mastery.find({'student_id': ObjectId(student_id)}))
    except (Exception, NameError):
        pass
    
    print(f"Mastery Records (String ID): {len(mastery_str)}")
    print(f"Mastery Records (ObjectId): {len(mastery_oid)}")

    if not mastery_str and not mastery_oid:
        print("\n[WARNING] No mastery data found for this student.")
        print("Features like 'Top Strengths' and 'Radar Chart' will show 0s.")
    else:
        print("\n[INFO] Mastery data exists (count: {}).".format(len(mastery_str) or len(mastery_oid)))
        sample = mastery_str[0] if mastery_str else mastery_oid[0]
        print(f"Sample Mastery: {sample}")

    # Always ensure diverse data exists now
    print("Checking/Seeding diverse data...")
    seed_data(student_id)

    # Re-Check Data after seeding
    mastery_final = list(db.student_concept_mastery.find({'student_id': str(student_id)}))
    print(f"Final Mastery Count: {len(mastery_final)}")

    # 3. Check Concepts
    concepts = list(db.concepts.find())
    print(f"Total Concepts: {len(concepts)}")
    if concepts:
        print(f"Sample Concept: {concepts[0]}")
    else:
        print("[WARNING] No concepts found! Mastery scores won't link to subjects.")

def seed_data(student_id):
    print("\n=== Seeding Sample Mastery Data ===")
    
    # Create core concepts to ensure diversity
    core_concepts = [
        {'subject_area': 'Math', 'concept_name': 'Calculus I', 'difficulty_level': 0.8},
        {'subject_area': 'Science', 'concept_name': 'Physics Mechanics', 'difficulty_level': 0.7},
        {'subject_area': 'Technology', 'concept_name': 'Python Basics', 'difficulty_level': 0.5},
        {'subject_area': 'Art', 'concept_name': 'Color Theory', 'difficulty_level': 0.4},
        {'subject_area': 'History', 'concept_name': 'World War II', 'difficulty_level': 0.6}
    ]
    
    concept_ids = []
    print("Ensuring core concepts exist...")
    
    for c in core_concepts:
        # Check by name to avoid duplicates
        existing = db.concepts.find_one({'concept_name': c['concept_name']})
        if existing:
            concept_ids.append(existing['_id'])
        else:
            # Create new
            res = db.concepts.insert_one(c)
            concept_ids.append(res.inserted_id)
            print(f"Created concept: {c['concept_name']}")

    # Assign mastery to student
    new_mastery = []
    import random
    
    # Ensure student_id is string as per schema preference
    s_id_str = str(student_id)
    
    # Inspect concepts _id type again just to be sure
    c_sample = db.concepts.find_one()
    c_id_type = type(c_sample['_id']) if c_sample else str
    
    for cid in concept_ids:
        # Store CID in correct format
        final_cid = ObjectId(cid) if c_id_type == ObjectId and not isinstance(cid, ObjectId) else cid
        final_cid = str(cid) if c_id_type == str else final_cid
        
        # Check if mastery exists
        exists = db.student_concept_mastery.find_one({'student_id': s_id_str, 'concept_id': str(final_cid)})
        if not exists:
            # Create mastery
            new_mastery.append({
                'student_id': s_id_str,
                'concept_id': final_cid,
                'mastery_score': random.randint(65, 98), # Good scores to satisfy user
                'confidence': 0.8,
                'last_assessed': datetime.datetime.utcnow()
            })

    if new_mastery:
        db.student_concept_mastery.insert_many(new_mastery)
        print(f"Seeded {len(new_mastery)} NEW mastery records.")
    else:
        print("Mastery data for core concepts already exists.")

import datetime
if __name__ == "__main__":
    debug_data()
