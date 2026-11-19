import { Pencil, X } from "lucide-react";

type EditDeleteActionsProps = { onEdit?: () => void; onDelete?: () => void; editLabel?: string; deleteLabel?: string };

export function EditDeleteActions({ onEdit, onDelete, editLabel = "수정", deleteLabel = "삭제" }: EditDeleteActionsProps) {
  return <div className="edit-delete-actions">
    {onEdit ? <button type="button" className="edit-delete-action edit-delete-action-edit" aria-label={editLabel} title={editLabel} onClick={onEdit}><Pencil size={19} strokeWidth={1.8} aria-hidden="true" /></button> : null}
    {onDelete ? <button type="button" className="edit-delete-action edit-delete-action-delete" aria-label={deleteLabel} title={deleteLabel} onClick={onDelete}><X size={19} strokeWidth={1.8} aria-hidden="true" /></button> : null}
  </div>;
}
