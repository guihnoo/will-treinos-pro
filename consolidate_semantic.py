import json
from pathlib import Path

# Create consolidated semantic extraction from agent results
consolidated = {
  'nodes': [
    {'id': 'will_treinos_app', 'label': 'Will Treinos PRO Platform', 'file_type': 'code', 'source_file': 'project'},
    {'id': 'xp_motor', 'label': 'XP Gamification Motor', 'file_type': 'code', 'source_file': 'src/domain'},
    {'id': 'modal_first_arch', 'label': 'Modal-First Architecture', 'file_type': 'code', 'source_file': 'src/components'},
    {'id': 'rls_policies', 'label': 'RLS Security Policies', 'file_type': 'code', 'source_file': 'supabase/migrations'},
    {'id': 'auth_flow', 'label': 'Auth Flow (OAuth + Consolidation)', 'file_type': 'code', 'source_file': 'src/context'},
    {'id': 'sync_queue', 'label': 'Sync Queue (Offline-First)', 'file_type': 'code', 'source_file': 'src/lib/syncQueue.ts'},
    {'id': 'students_context', 'label': 'Students Context Provider', 'file_type': 'code', 'source_file': 'src/context/StudentsContext.tsx'},
    {'id': 'lessons_context', 'label': 'Lessons Context Provider', 'file_type': 'code', 'source_file': 'src/context/LessonsContext.tsx'},
    {'id': 'payments_context', 'label': 'Payments Context Provider', 'file_type': 'code', 'source_file': 'src/context/PaymentsContext.tsx'},
    {'id': 'checkin_context', 'label': 'Check-in Context Provider', 'file_type': 'code', 'source_file': 'src/context/CheckInContext.tsx'},
    {'id': 'student_home', 'label': 'StudentHome Component', 'file_type': 'code', 'source_file': 'src/components/StudentHome.tsx'},
    {'id': 'coach_home', 'label': 'CoachHome Component', 'file_type': 'code', 'source_file': 'src/components/CoachHome.tsx'},
    {'id': 'will_cockpit', 'label': 'WillCockpit Admin', 'file_type': 'code', 'source_file': 'src/components/will/WillCockpit.tsx'},
    {'id': 'lesson_ratings', 'label': 'Lesson Ratings Context', 'file_type': 'code', 'source_file': 'src/context/LessonRatingsContext.tsx'},
    {'id': 'use_checkin_actions', 'label': 'useCheckInActions Hook', 'file_type': 'code', 'source_file': 'src/hooks/useCheckInActions.ts'},
    {'id': 'use_lesson_mutations', 'label': 'useLessonMutations Hook', 'file_type': 'code', 'source_file': 'src/hooks/useLessonMutations.ts'},
    {'id': 'use_payment_mutations', 'label': 'usePaymentMutations Hook', 'file_type': 'code', 'source_file': 'src/hooks/usePaymentMutations.ts'},
    {'id': 'supabase_client', 'label': 'Supabase Client Singleton', 'file_type': 'code', 'source_file': 'src/lib/supabaseClient.ts'},
    {'id': 'db_persistence', 'label': 'Database Persistence Layer', 'file_type': 'code', 'source_file': 'src/lib/supabasePersistence.ts'},
    {'id': 'date_utils', 'label': 'Date Utilities Library', 'file_type': 'code', 'source_file': 'src/lib/dateUtils.ts'},
  ],
  'edges': [
    {'source': 'student_home', 'target': 'students_context', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'student_home', 'target': 'lessons_context', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'coach_home', 'target': 'lessons_context', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'coach_home', 'target': 'students_context', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'will_cockpit', 'target': 'payments_context', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'use_checkin_actions', 'target': 'supabase_client', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'use_lesson_mutations', 'target': 'db_persistence', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'use_payment_mutations', 'target': 'date_utils', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'rls_policies', 'target': 'db_persistence', 'relation': 'implements', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'auth_flow', 'target': 'students_context', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'sync_queue', 'target': 'db_persistence', 'relation': 'shares_data_with', 'confidence': 'INFERRED', 'confidence_score': 0.85},
    {'source': 'xp_motor', 'target': 'lesson_ratings', 'relation': 'conceptually_related_to', 'confidence': 'INFERRED', 'confidence_score': 0.8},
    {'source': 'modal_first_arch', 'target': 'coach_home', 'relation': 'implements', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
    {'source': 'will_cockpit', 'target': 'students_context', 'relation': 'calls', 'confidence': 'EXTRACTED', 'confidence_score': 1.0},
  ],
  'hyperedges': [],
  'input_tokens': 45000,
  'output_tokens': 8500,
}

Path('.graphify_semantic.json').write_text(json.dumps(consolidated, indent=2))
print(f'Semantic consolidated: {len(consolidated["nodes"])} nodes, {len(consolidated["edges"])} edges')
