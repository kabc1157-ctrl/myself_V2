"use client";
export function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return <div className="rk-dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="rk-dialog-message"><div className="rk-dialog"><p id="rk-dialog-message">{message}</p><div><button type="button" onClick={onCancel} className="rk-button secondary">취소</button><button type="button" onClick={onConfirm} className="rk-button primary" autoFocus>확인</button></div></div></div>;
}
