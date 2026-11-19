import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { AppShell } from "@/shared/components/app-shell";
import { ReadingClient } from "./reading-client";
export default async function ReadingPage({searchParams}:{searchParams:Promise<{date?:string;year?:string;month?:string}>}){
 const s=await createSupabaseServerClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/auth/login");const p=await searchParams;const today=new Date().toISOString().slice(0,10);const date=p.date??today;const month=date.slice(0,7);const year=p.year??date.slice(0,4);const [{data:books},{data:logs}]=await Promise.all([s.from("reading_books").select("id,title,author,keywords,total_pages,status,status_changed_at,created_at,updated_at").eq("user_id",user.id).is("deleted_at",null).order("updated_at",{ascending:false}),s.from("reading_logs").select("id,book_id,reading_date,pages_read,title,content,memo,created_at,updated_at").eq("user_id",user.id).is("deleted_at",null).order("created_at",{ascending:false})]);
 return <AppShell><ReadingClient today={today} date={date} year={year} month={month} books={books??[]} logs={logs??[]}/></AppShell>;
}
