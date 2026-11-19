import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { AppShell } from "@/shared/components/app-shell";
import { ProjectClient } from "./project-client";

export default async function ProjectPage({ searchParams }: { searchParams: Promise<{ project?: string; year?: string }> }) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login");
  const params = await searchParams;
  const { data: projects } = await supabase.from("projects").select("id,title,description,start_date,target_date,category,status,status_source,completed_at,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  const selectedId = params.project && projects?.some((p) => p.id === params.project) ? params.project : projects?.[0]?.id;
  const [{ data: todos }, { data: reflections }, { data: looseTodos }, { data: projectTodos }] = await Promise.all([
    supabase.from("todos").select("id,title,memo,planned_date,is_completed,completed_at,project_id,created_at,updated_at").eq("user_id", user.id).not("project_id", "is", null).order("is_completed").order("created_at", { ascending: false }),
    supabase.from("project_reflections").select("id,project_id,content,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("todos").select("id,title,memo,planned_date,is_completed,completed_at,project_id").eq("user_id", user.id).is("project_id", null).order("created_at", { ascending: false }),
    supabase.from("todos").select("project_id,is_completed").eq("user_id", user.id).not("project_id", "is", null),
  ]);
  const projectTodoCounts = (projectTodos ?? []).reduce<Record<string, { completed: number; total: number }>>((result, todo) => { if (!todo.project_id) return result; const current = result[todo.project_id] ?? { completed: 0, total: 0 }; current.total += 1; if (todo.is_completed) current.completed += 1; result[todo.project_id] = current; return result; }, {});
  return <AppShell><ProjectClient projects={projects ?? []} selectedId={selectedId ?? null} todos={todos ?? []} reflections={reflections ?? []} looseTodos={looseTodos ?? []} projectTodoCounts={projectTodoCounts} year={params.year ?? String(new Date().getFullYear())} /></AppShell>;
}
