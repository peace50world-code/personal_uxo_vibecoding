import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 그룹 가입 시 그날(가입 당일) 로컬에 기록된 절약 내역을 해당 그룹에 백필.
// 원래 createdAt을 보존해서 통계가 오늘 데이터로 잡히게 함.
export async function backfillTodayRecords(groupId: string, nickname: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("piggy-records");
    if (!raw) return;
    const records = JSON.parse(raw) as Array<{
      id: string; amount: number; situation: string | null; memo: string; createdAt: string;
    }>;
    const todayStr = new Date().toDateString();
    const todays = records.filter(r => new Date(r.createdAt).toDateString() === todayStr);
    if (todays.length === 0) return;

    await supabase.from("records").insert(
      todays.map(r => ({
        group_id: groupId,
        nickname,
        amount: r.amount,
        situation: r.situation,
        memo: r.memo,
        created_at: r.createdAt,
      }))
    );
  } catch (e) {
    console.error("backfill failed:", e);
  }
}
