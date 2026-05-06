// Placeholder: TrainingPlanEditor stub (Phase 7 migration)
import type { Student, TrainingPlan } from "@/context/types";

interface TrainingPlanEditorProps {
  student?: Student;
  existingPlan?: TrainingPlan;
  onClose?: () => void;
}

export default function TrainingPlanEditor({ student, existingPlan, onClose }: TrainingPlanEditorProps) {
  return null;
}
