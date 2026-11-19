import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { AppShell } from "@/shared/components/app-shell";
import { MemoClient } from "./memo-client";

export default async function MemoPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; sort?: string }> }) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login"); const params = await searchParams; const tab = params.tab === "checklists" ? "checklists" : "memos"; const q = params.q ?? ""; const sort = params.sort === "created" ? "created" : "updated";
  const memoQuery = supabase.from("memos").select("id,title,content,note,topic_id,is_pinned,created_at,updated_at,deleted_at").eq("user_id", user.id).is("deleted_at", null).order(sort === "created" ? "created_at" : "updated_at", { ascending: false });
  const checklistQuery = supabase.from("checklists").select("id,title,is_pinned,created_at,updated_at,deleted_at,checklist_items(id,content,is_completed,order_index,created_at,updated_at)").eq("user_id", user.id).is("deleted_at", null).order(sort === "created" ? "created_at" : "updated_at", { ascending: false });
  const [{ data: memos }, { data: checklists }, { data: topics }] = await Promise.all([memoQuery, checklistQuery, supabase.from("memo_topics").select("id,name").eq("user_id", user.id).order("name")]);
  const filteredMemos = (memos ?? []).filter((item) => !q || item.title.toLowerCase().includes(q.toLowerCase()) || item.content.toLowerCase().includes(q.toLowerCase()));
  const filteredChecklists = (checklists ?? []).filter((item) => !q || item.title.toLowerCase().includes(q.toLowerCase()) || item.checklist_items?.some((child: { content: string }) => child.content.toLowerCase().includes(q.toLowerCase())));
  return <AppShell><MemoClient tab={tab} query={q} sort={sort} memos={filteredMemos} checklists={filteredChecklists} topics={topics ?? []} /></AppShell>;
}
