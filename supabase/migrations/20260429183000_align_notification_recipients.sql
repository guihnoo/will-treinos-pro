-- Align demo notifications: student drawer keys off recipient_id (CRM students.id), like financeiro.
-- Admin/coach still see all rows; rows without recipient_id and not global remain staff-only.

UPDATE public.notifications SET recipient_id = 'demo_stu_pedro' WHERE id = 'demo_nf_pedro';
UPDATE public.notifications SET recipient_id = 'demo_stu_julia' WHERE id = 'demo_nf_atraso';
UPDATE public.notifications SET recipient_id = 'demo_stu_ricardo' WHERE id = 'demo_nf_feedback';
