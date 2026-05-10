-- Add student_role column to students table
-- Valores: 'aluno' (default), 'observador', 'professor'

ALTER TABLE students
ADD COLUMN student_role text NOT NULL DEFAULT 'aluno'
CHECK (student_role IN ('aluno', 'observador', 'professor'));

-- Index para queries rápidas por role
CREATE INDEX idx_students_role ON students(student_role);

-- Comentário documentando os papéis
COMMENT ON COLUMN students.student_role IS
'Papel do aluno: aluno (treina, ganha XP), observador (feed-only), professor (acesso admin)';
