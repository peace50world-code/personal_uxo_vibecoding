"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getProfile } from "../onboarding/page";

const LAST_READ_KEY = "piggy-notif-last-read";

interface NotifRecord {
  kind: "record";
  id: string;
  ts: string;
  groupId: string;
  groupName: string;
  nickname: string;
  amount: number;
  situation: string | null;
  memo: string;
}

interface NotifMember {
  kind: "member";
  id: string;
  ts: string;
  groupId: string;
  groupName: string;
  nickname: string;
}

type Notification = NotifRecord | NotifMember;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1)  return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items,   setItems]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRead, setLastRead] = useState<string>("");

  const myNickname = getProfile()?.nickname ?? "";

  useEffect(() => {
    async function load() {
      if (!myNickname) { setLoading(false); return; }

      // 현재의 last_read 값을 기억해놓고 (방금 본 알림 표시용)
      const prevLastRead = localStorage.getItem(LAST_READ_KEY) ?? new Date(0).toISOString();
      setLastRead(prevLastRead);

      // 1) 내 그룹 멤버십 (group_id + 내가 가입한 시점 + 그룹 이름)
      const { data: myMemberships } = await supabase
        .from("group_members")
        .select("group_id, joined_at, groups(name)")
        .eq("nickname", myNickname);

      if (!myMemberships || myMemberships.length === 0) {
        setLoading(false);
        // 빈 상태에서도 last_read를 갱신
        localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
        return;
      }

      const groupIds: string[] = myMemberships.map(m => m.group_id);
      const groupNames: Record<string, string> = {};
      const myJoinedAt:  Record<string, string> = {};
      myMemberships.forEach(m => {
        groupNames[m.group_id] = (m.groups as any)?.name ?? "그룹";
        myJoinedAt[m.group_id] = m.joined_at;
      });

      // 2) 친구들의 절약 기록 (내 것 제외) + 그룹 멤버 가입 (내 것 제외) 병렬 fetch
      const [{ data: records }, { data: members }] = await Promise.all([
        supabase.from("records")
          .select("id, group_id, nickname, amount, situation, memo, created_at")
          .in("group_id", groupIds)
          .neq("nickname", myNickname)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("group_members")
          .select("id, group_id, nickname, joined_at")
          .in("group_id", groupIds)
          .neq("nickname", myNickname)
          .order("joined_at", { ascending: false })
          .limit(100),
      ]);

      const recordItems: NotifRecord[] = (records ?? []).map(r => ({
        kind: "record" as const,
        id: r.id,
        ts: r.created_at,
        groupId: r.group_id,
        groupName: groupNames[r.group_id] ?? "그룹",
        nickname: r.nickname,
        amount: r.amount,
        situation: r.situation,
        memo: r.memo,
      }));

      // 내가 가입한 시점 이후에 들어온 멤버만 알림으로 노출
      const memberItems: NotifMember[] = (members ?? [])
        .filter(m => new Date(m.joined_at) > new Date(myJoinedAt[m.group_id] ?? 0))
        .map(m => ({
          kind: "member" as const,
          id: m.id,
          ts: m.joined_at,
          groupId: m.group_id,
          groupName: groupNames[m.group_id] ?? "그룹",
          nickname: m.nickname,
        }));

      const combined = [...recordItems, ...memberItems]
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

      setItems(combined);
      setLoading(false);

      // 페이지를 봤으니 last_read를 지금으로 갱신 (이후 진입 시 모두 읽음 처리)
      localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
    }
    load();
  }, [myNickname]);

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* 상태바 여백 */}
        <div className="status-bar" />

        {/* 헤더 */}
        <header className="page-header">
          <button className="back-btn" onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) router.back();
            else router.push("/");
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="page-title">알림</h1>
          <div style={{ width: 36 }} />
        </header>

        {/* 내용 */}
        <main className="content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">🔔</p>
              <p className="empty-title">새로운 알림이 없어요</p>
              <p className="empty-sub">친구들의 절약 기록과 신규 가입 소식이 이곳에 표시돼요</p>
            </div>
          ) : (
            <ul className="notif-list">
              {items.map(n => {
                const isUnread = new Date(n.ts) > new Date(lastRead);
                return (
                  <li key={`${n.kind}-${n.id}`} className={`notif-item ${isUnread ? "notif-item--unread" : ""}`}>
                    <Link href={`/group/${n.groupId}`} className="notif-link">
                      <div className="notif-icon">
                        {n.kind === "record" ? "🐷" : "👋"}
                      </div>
                      <div className="notif-body">
                        <p className="notif-text">
                          {n.kind === "record" ? (
                            <>
                              <strong>{n.nickname}</strong>님이{" "}
                              <span className="notif-group">{n.groupName}</span>에서{" "}
                              <strong className="notif-amount">{n.amount.toLocaleString()}원</strong> 절약했어요
                              {n.situation && <span className="notif-sit"> · {n.situation}</span>}
                            </>
                          ) : (
                            <>
                              <strong>{n.nickname}</strong>님이{" "}
                              <span className="notif-group">{n.groupName}</span>에 새로 참여했어요
                            </>
                          )}
                        </p>
                        <span className="notif-time">{formatTime(n.ts)}</span>
                      </div>
                      {isUnread && <span className="notif-unread-dot" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ height: 40 }} />
        </main>

      </div>
    </>
  );
}

const css = `
  .shell {
    width: 100%; max-width: 402px; min-height: 100svh; margin: 0 auto;
    background: #fff; display: flex; flex-direction: column;
    font-family: 'Pretendard', -apple-system, sans-serif;
    position: relative; -webkit-tap-highlight-color: transparent;
  }
  .status-bar { height: 44px; flex-shrink: 0; }
  .page-header {
    height: 56px; padding: 0 16px; display: flex; align-items: center;
    justify-content: space-between; flex-shrink: 0; border-bottom: 1px solid #F1F1F5;
  }
  .back-btn {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: #111;
  }
  .page-title {
    font-size: 17px; font-weight: 700; color: #111;
    flex: 1; text-align: center; letter-spacing: -0.02em;
  }
  .content { flex: 1; overflow-y: auto; scrollbar-width: none; }
  .content::-webkit-scrollbar { display: none; }
  .loading-state {
    display: flex; align-items: center; justify-content: center; padding: 80px 0;
  }
  .spinner-lg {
    width: 32px; height: 32px; border-radius: 50%;
    border: 3px solid #F1F1F5; border-top-color: #FF2A7A;
    animation: spin 0.7s linear infinite;
  }
  .empty-state {
    display: flex; flex-direction: column; align-items: center;
    padding: 80px 32px; gap: 10px;
  }
  .empty-icon { font-size: 56px; }
  .empty-title { font-size: 16px; font-weight: 700; color: #111; }
  .empty-sub { font-size: 13px; color: #767676; text-align: center; line-height: 1.6; }
  .notif-list { list-style: none; padding: 0; margin: 0; }
  .notif-item {
    border-bottom: 1px solid #F7F7F7;
    transition: background 0.15s;
  }
  .notif-item--unread { background: #FFF8FB; }
  .notif-link {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 16px 20px; text-decoration: none; color: inherit;
    position: relative;
  }
  .notif-link:active { background: #FAFAFA; }
  .notif-icon {
    width: 40px; height: 40px; border-radius: 50%;
    background: #F7F7F7;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .notif-item--unread .notif-icon { background: #FFE8F2; }
  .notif-body { flex: 1; min-width: 0; }
  .notif-text {
    font-size: 14px; color: #111; line-height: 1.5;
    word-break: keep-all;
  }
  .notif-text strong { font-weight: 700; }
  .notif-group { color: #FF2A7A; font-weight: 600; }
  .notif-amount { color: #FF2A7A; }
  .notif-sit { color: #767676; }
  .notif-time {
    display: block; margin-top: 4px;
    font-size: 12px; color: #BBBBBB;
  }
  .notif-unread-dot {
    position: absolute; top: 22px; right: 18px;
    width: 8px; height: 8px; border-radius: 50%;
    background: #FF2A7A; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
