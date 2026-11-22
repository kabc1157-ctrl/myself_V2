"use client";

import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProject, deleteProjectReflection, saveProject, saveProjectReflection, saveProjectTodo, setProjectStatus, toggleProjectTodo } from "@/core/project-actions";
import { deleteTodo } from "@/core/schedule-actions";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { CollapsibleRecordCard, InlineRecordEditor, ProgressRing, RecordItem, RecordPageHeader } from "@/shared/components/record-kit";
import { useToast } from "@/shared/components/toast-provider";
import { EditDeleteActions } from "@/shared/components/edit-delete-actions";

type Project = { id: string; title: string; description: string; start_date: string | null; target_date: string | null; classification: string; category: string; status: string; status_source: string; completed_at: string | null; created_at: string; updated_at: string };
type Todo = { id: string; title: string; memo: string; planned_date: string | null; is_completed: boolean; completed_at: string | null; project_id: string | null; created_at?: string; updated_at?: string };
type Reflection = { id: string; project_id: string; content: string; created_at: string; updated_at: string };
type Form = { title: string; description: string; startDate: string; targetDate: string; classification: string; category: string; status: string };

const emptyProject: Form = { title: "", description: "", startDate: "", targetDate: "", classification: "career", category: "", status: "planned" };
const classificationLabel: Record<string, string> = { asset: "자산", relationship: "관계", career: "커리어", health: "건강" };
const statusLabel: Record<string, string> = { planned: "예정", in_progress: "진행 중", on_hold: "보류", completed: "완료" };

type ProjectCardProps = {
  project: Project;
  todos: Todo[];
  reflections: Reflection[];
  looseTodos: Todo[];
  counts: { completed: number; total: number };
  projects: Project[];
  onDeleted: () => void;
};

function ProjectCard({ project, todos, reflections, looseTodos, counts, projects, onDeleted }: ProjectCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form>({ title: project.title, description: project.description, startDate: project.start_date ?? "", targetDate: project.target_date ?? "", classification: project.classification ?? "career", category: project.category, status: project.status });
  const [todoEditing, setTodoEditing] = useState<string | null>(null);
  const [todoForm, setTodoForm] = useState({ title: "", memo: "", plannedDate: "", todoId: "" });
  const [reflection, setReflection] = useState("");
  const [reflectionEditing, setReflectionEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<(() => void) | null>(null);
  const todoSaveLock = useRef(false);
  const percent = counts.total ? Math.min(100, Math.round((counts.completed / counts.total) * 100)) : 0;

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) => start(async () => {
    const result = await action();
    showToast(result.ok ? success : result.error ?? "요청을 처리하지 못했어요.", result.ok ? "success" : "error");
    if (result.ok) after?.();
  });

  const saveProjectForm = () => run(
    () => saveProject({ ...form, id: project.id, startDate: form.startDate || null, targetDate: form.targetDate || null }),
    "프로젝트를 수정했어요.",
    () => { setEditing(false); setOpen(false); router.refresh(); }
  );

  const saveTodoForm = (todoId?: string) => { if (todoSaveLock.current) return; todoSaveLock.current = true; run(
    () => saveProjectTodo({ projectId: todoId ? todoForm.todoId : (todoForm.todoId || project.id), todoId: todoId ?? undefined, title: todoForm.title || looseTodos.find(todo => todo.id === todoForm.todoId)?.title || "", memo: todoForm.memo, plannedDate: todoForm.plannedDate || null }),
    todoId ? "TODO를 수정했어요." : "TODO를 저장했어요.",
    () => { todoSaveLock.current = false; setTodoEditing(null); setTodoForm({ title: "", memo: "", plannedDate: "", todoId: "" }); setOpen(true); router.refresh(); }
  ); setTimeout(() => { todoSaveLock.current = false; }, 5000); };

  const editTodo = (todo: Todo) => {
    setTodoEditing(todo.id);
    setTodoForm({ title: todo.title, memo: todo.memo, plannedDate: todo.planned_date ?? "", todoId: project.id });
  };

  const content = (
    <>
      {editing ? <InlineRecordEditor>
        <div className="rk-form">
          <label>제목<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
          <label>설명<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
          <div className="project-form-grid">
            <label>시작일<input type="date" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} /></label>
            <label>목표일<input type="date" value={form.targetDate} onChange={event => setForm({ ...form, targetDate: event.target.value })} /></label>
          </div>
          <label>분류<select value={form.classification} onChange={event => setForm({ ...form, classification: event.target.value })}>{Object.entries(classificationLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>카테고리<input value={form.category} placeholder="예: 이직 준비" onChange={event => setForm({ ...form, category: event.target.value })} /></label>
          <label>상태<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <div className="rk-actions">
            <button className="rk-button primary" disabled={pending || !form.title.trim()} onClick={saveProjectForm}>저장</button>
            <button className="rk-button secondary" onClick={() => setEditing(false)}>취소</button>
          </div>
        </div>
      </InlineRecordEditor> : null}

      <section className="project-detail-content">
        <p className="rk-original-text">{project.description || "설명이 없어요."}</p>
        <div className="rk-actions">
          <button className="rk-button secondary" onClick={() => setEditing(true)}>수정</button>
          <button className="rk-button danger" onClick={() => setConfirm(() => () => run(() => deleteProject(project.id), "프로젝트를 삭제했어요.", onDeleted))}>삭제</button>
        </div>

        <div className="project-subheading"><h3 className="rk-section-title">프로젝트 회고</h3></div>
        {reflections.length ? reflections.map(item => <RecordItem key={item.id}>
          {reflectionEditing === item.id ? <InlineRecordEditor><textarea value={reflection} onChange={event => setReflection(event.target.value)} /><div className="rk-actions"><button className="rk-button primary" disabled={pending || !reflection.trim()} onClick={() => run(() => saveProjectReflection({ id: item.id, projectId: project.id, content: reflection }), "회고를 수정했어요.", () => { setReflectionEditing(null); setReflection(""); router.refresh(); })}>완료</button><button className="rk-button secondary" onClick={() => setReflectionEditing(null)}>취소</button></div></InlineRecordEditor> : <><p className="rk-original-text">{item.content}</p><div className="rk-actions"><EditDeleteActions onEdit={() => { setReflectionEditing(item.id); setReflection(item.content); }} onDelete={() => setConfirm(() => () => run(() => deleteProjectReflection(item.id), "회고를 삭제했어요.", () => router.refresh()))} /></div></>}
        </RecordItem>) : <div className="project-empty-state"><p>작성된 회고가 없어요.</p><button className="rk-button secondary" type="button" onClick={() => { setReflectionEditing("new"); setReflection(""); }}>회고 작성</button></div>}
        {reflectionEditing === "new" ? <InlineRecordEditor><textarea value={reflection} onChange={event => setReflection(event.target.value)} placeholder="프로젝트 회고를 적어보세요." /><div className="rk-actions"><button className="rk-button primary" disabled={pending || !reflection.trim()} onClick={() => run(() => saveProjectReflection({ projectId: project.id, content: reflection }), "회고를 저장했어요.", () => { setReflectionEditing(null); setReflection(""); router.refresh(); })}>완료</button><button className="rk-button secondary" onClick={() => setReflectionEditing(null)}>취소</button></div></InlineRecordEditor> : null}

        <div className="project-subheading"><h3 className="rk-section-title">프로젝트 TODO</h3><button className="rk-button secondary" type="button" onClick={() => { setTodoEditing("new"); setTodoForm({ title: "", memo: "", plannedDate: "", todoId: project.id }); }}>TODO 추가</button></div>
        {todoEditing === "new" ? <div className="rk-inline-editor project-todo-editor"><label>TODO명<input value={todoForm.title} onChange={event => setTodoForm({ ...todoForm, title: event.target.value })} /></label><label>날짜<input type="date" value={todoForm.plannedDate} onChange={event => setTodoForm({ ...todoForm, plannedDate: event.target.value })} /></label><label>프로젝트<select value={todoForm.todoId} onChange={event => setTodoForm({ ...todoForm, todoId: event.target.value })}>{projects.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><div className="rk-actions"><button className="rk-button primary" disabled={pending || !todoForm.title.trim()} onClick={() => saveTodoForm()}>저장</button><button className="rk-button secondary" onClick={() => setTodoEditing(null)}>취소</button></div></div> : null}

        {todos.length ? todos.map(todo => <RecordItem key={todo.id}>
          <div className="todo-row">
            <label><input type="checkbox" checked={todo.is_completed} onChange={event => run(() => toggleProjectTodo(todo.id, event.target.checked), event.target.checked ? "TODO를 완료했어요." : "TODO 완료를 취소했어요.", () => router.refresh())} /><span className={todo.is_completed ? "is-done" : ""}>{todo.title}</span><small>{todo.planned_date ?? ""}</small></label>
            <div className="rk-actions">
              <EditDeleteActions onEdit={() => editTodo(todo)} onDelete={() => setConfirm(() => () => run(() => deleteTodo(todo.id), "TODO를 삭제했어요.", () => router.refresh()))} />
            </div>
          </div>
          {todoEditing === todo.id ? <InlineRecordEditor>
            <div className="rk-form">
              <input value={todoForm.title} onChange={event => setTodoForm({ ...todoForm, title: event.target.value })} />
              <input type="date" value={todoForm.plannedDate} onChange={event => setTodoForm({ ...todoForm, plannedDate: event.target.value })} />
              <select value={todoForm.todoId} onChange={event => setTodoForm({ ...todoForm, todoId: event.target.value })}>{projects.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
              <textarea value={todoForm.memo} onChange={event => setTodoForm({ ...todoForm, memo: event.target.value })} />
              <div className="rk-actions">
                <button className="rk-button primary" disabled={pending || !todoForm.title.trim()} onClick={() => saveTodoForm(todo.id)}>수정 완료</button>
                <button className="rk-button secondary" onClick={() => setTodoEditing(null)}>취소</button>
              </div>
            </div>
          </InlineRecordEditor> : null}
        </RecordItem>) : <p className="rk-empty">연결된 TODO가 없어요.</p>}

        <h3 className="rk-section-title">프로젝트 상태</h3>
        <div className="rk-actions">{Object.entries(statusLabel).map(([key, label]) => <button key={key} className={"rk-button " + (project.status === key ? "primary" : "secondary")} onClick={() => run(() => setProjectStatus(project.id, key), label + " 상태로 변경했어요.", () => router.refresh())}>{label}</button>)}</div>

      </section>
    </>
  );

  return <CollapsibleRecordCard title={project.title} triggerContent={<><span className="project-card-trigger"><strong>{project.title}</strong><small>목표일 {project.target_date ?? "없음"} · {percent}%</small></span><span className="rk-plus" aria-hidden="true">+</span></>} open={open} onOpenChange={setOpen}>
    <div className="project-card-summary">
      <div><strong>{statusLabel[project.status]}</strong><span>{counts.completed}/{counts.total} TODO · {percent}%</span><span>목표일 {project.target_date ?? "없음"}</span></div>
      <ProgressRing completed={counts.completed} total={counts.total} label={project.title + " 진행률"} />
    </div>
    <div className="rk-actions"><button className="rk-button secondary" onClick={() => { setOpen(true); setEditing(true); }}>수정</button><button className="rk-button danger" onClick={() => setConfirm(() => () => run(() => deleteProject(project.id), "프로젝트를 삭제했어요.", onDeleted))}>삭제</button></div>
    {open ? content : null}
    {confirm ? <ConfirmDialog message="이 작업을 진행할까요?" onCancel={() => setConfirm(null)} onConfirm={() => { const action = confirm; setConfirm(null); action(); }} /> : null}
  </CollapsibleRecordCard>;
}

function ProjectGroup({ title, items, render }: { title: string; items: Project[]; render: (project: Project) => ReactNode }) {
  const [open, setOpen] = useState(true);
  return <section className="project-group"><button type="button" className="project-group-toggle" aria-expanded={open} onClick={() => setOpen(value => !value)}><h2 className="rk-section-title">{title}({items.length})</h2><span aria-hidden="true">{open ? "−" : "+"}</span></button>{open ? (items.length ? items.map(render) : <p className="rk-empty">프로젝트가 없어요.</p>) : null}</section>;
}

export function ProjectClient({ projects, todos, reflections, looseTodos, projectTodoCounts, year }: { projects: Project[]; selectedId: string | null; todos: Todo[]; reflections: Reflection[]; looseTodos: Todo[]; projectTodoCounts: Record<string, { completed: number; total: number }>; year: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, start] = useTransition();
  const [openNew, setOpenNew] = useState(false);
  const [newForm, setNewForm] = useState(emptyProject);
  const [openReflection, setOpenReflection] = useState(false);
  const [reflectionProjectId, setReflectionProjectId] = useState(projects[0]?.id ?? "");
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionStatus, setReflectionStatus] = useState("planned");
  const years = useMemo(() => Array.from(new Set([...projects.map(project => (project.start_date ?? project.created_at).slice(0, 4)), String(new Date().getFullYear())])).sort().reverse(), [projects]);
  const visible = projects.filter(project => year === "all" || (project.start_date ?? project.created_at).slice(0, 4) === year);
  const create = () => start(async () => { if (newForm.startDate && newForm.targetDate && newForm.startDate > newForm.targetDate) { showToast("시작일은 목표일보다 늦을 수 없어요.", "error"); return; } const result = await saveProject({ ...newForm, startDate: newForm.startDate || null, targetDate: newForm.targetDate || null }); showToast(result.ok ? "프로젝트를 만들었어요." : result.error ?? "저장하지 못했어요.", result.ok ? "success" : "error"); if (result.ok) { setNewForm(emptyProject); setOpenNew(false); router.refresh(); } });
  const saveReflection = () => start(async () => { if (!reflectionProjectId || !reflectionText.trim()) return; const statusResult = await setProjectStatus(reflectionProjectId, reflectionStatus); if (!statusResult.ok) { showToast(statusResult.error ?? "프로젝트 상태를 저장하지 못했어요.", "error"); return; } const result = await saveProjectReflection({ projectId: reflectionProjectId, content: reflectionText }); showToast(result.ok ? "프로젝트 회고를 저장했어요." : result.error ?? "회고를 저장하지 못했어요.", result.ok ? "success" : "error"); if (result.ok) { setReflectionText(""); setOpenReflection(false); router.refresh(); } });
  const todoCounts = (id: string) => projectTodoCounts[id] ?? { completed: 0, total: 0 };
  const render = (project: Project) => <ProjectCard key={project.id} project={project} projects={projects} todos={todos.filter(todo => todo.project_id === project.id)} reflections={reflections.filter(item => item.project_id === project.id)} looseTodos={looseTodos} counts={todoCounts(project.id)} onDeleted={() => router.refresh()} />;
  return <div className="rk-page project-page">
    <RecordPageHeader eyebrow="관리 ・ 목표" title="프로젝트" action={<Link className="project-schedule-link" href="/schedule">일정 관리로 이동</Link>} />
    <section className="rk-summary-strip"><article><span>전체 프로젝트</span><strong>{visible.length}</strong></article><article><span>진행 중</span><strong>{visible.filter(project => project.status === "in_progress").length}</strong></article><article><span>완료</span><strong>{visible.filter(project => project.status === "completed").length}</strong></article></section>
    <CollapsibleRecordCard title="프로젝트 추가" open={openNew} onOpenChange={setOpenNew}><div className="rk-form"><label>제목<input value={newForm.title} onChange={event => setNewForm({ ...newForm, title: event.target.value })} /></label><label>설명<textarea value={newForm.description} onChange={event => setNewForm({ ...newForm, description: event.target.value })} /></label><div className="project-form-grid"><label>시작일<input type="date" value={newForm.startDate} onChange={event => setNewForm({ ...newForm, startDate: event.target.value })} /></label><label>목표일<input type="date" value={newForm.targetDate} onChange={event => setNewForm({ ...newForm, targetDate: event.target.value })} /></label></div><label>분류<select value={newForm.classification} onChange={event => setNewForm({ ...newForm, classification: event.target.value })}>{Object.entries(classificationLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>카테고리<input value={newForm.category} placeholder="예: 이직 준비" onChange={event => setNewForm({ ...newForm, category: event.target.value })} /></label><label>상태<select value={newForm.status} onChange={event => setNewForm({ ...newForm, status: event.target.value })}>{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={label}>{label}</option>)}</select></label><button className="rk-button primary" disabled={pending || !newForm.title.trim()} onClick={create}>저장</button></div></CollapsibleRecordCard>
    <CollapsibleRecordCard title="프로젝트 회고" open={openReflection} onOpenChange={setOpenReflection}><div className="rk-form"><label>프로젝트 선택<select value={reflectionProjectId} onChange={event => { setReflectionProjectId(event.target.value); setReflectionStatus(projects.find(project => project.id === event.target.value)?.status ?? "planned"); }}>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><label>회고 내용<textarea value={reflectionText} onChange={event => setReflectionText(event.target.value)} /></label><label>프로젝트 상태<select value={reflectionStatus} onChange={event => setReflectionStatus(event.target.value)}>{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="rk-button primary" disabled={pending || !reflectionProjectId || !reflectionText.trim()} onClick={saveReflection}>저장</button></div></CollapsibleRecordCard>
    <section className="project-filter"><label>연도<select value={year} onChange={event => router.push("/project?year=" + event.target.value, { scroll: false })}><option value="all">전체 연도</option>{years.map(item => <option key={item} value={item}>{item}년</option>)}</select></label></section>
    <ProjectGroup title="진행 중" items={visible.filter(project => project.status === "in_progress")} render={render} />
    <ProjectGroup title="예정·보류" items={visible.filter(project => project.status === "planned" || project.status === "on_hold")} render={render} />
    <ProjectGroup title="완료" items={visible.filter(project => project.status === "completed")} render={render} />
  </div>;
}
