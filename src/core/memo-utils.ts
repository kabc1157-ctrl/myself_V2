export type ChecklistItemLike = { is_completed: boolean; order_index: number };
export function checklistProgress(items: ChecklistItemLike[]) { const total = items.length; const completed = items.filter((item) => item.is_completed).length; return { completed, total, rate: total ? Math.round((completed / total) * 100) : 0 }; }
export function sortChecklistItems<T extends ChecklistItemLike>(items: T[]) { return [...items].sort((a, b) => Number(a.is_completed) - Number(b.is_completed) || a.order_index - b.order_index); }
