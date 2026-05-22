"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getProfile } from "../../onboarding/page";

interface Member { id: string; nickname: string; joined_at: string; }
interface Record {
  id: string; nickname: string; amount: number;
  situation: string | null; memo: string; created_at: string;
}
interface Group { id: string; name: string; invite_code: string; created_at: string; }

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1)  return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}시간 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const PIG_REACTIONS = ["독하다독해", "절약왕!", "대단해!", "나도 참을게", "존경해 🫡", "파이팅! 💪"];

function PigSketch({ reacted, onClick }: { reacted: boolean; onClick: () => void }) {
  return (
    <button className={`pig-btn ${reacted ? "pig-btn--reacted" : ""}`} onClick={onClick} aria-label="돼지 리액션">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 귀 */}
        <ellipse cx="14" cy="20" rx="7" ry="8" fill={reacted ? "#FFB6CC" : "#F5C8D4"} stroke={reacted ? "#E8809A" : "#D4A0B0"} strokeWidth="1.2"/>
        <ellipse cx="42" cy="20" rx="7" ry="8" fill={reacted ? "#FFB6CC" : "#F5C8D4"} stroke={reacted ? "#E8809A" : "#D4A0B0"} strokeWidth="1.2"/>
        <ellipse cx="14" cy="21" rx="3.5" ry="4.5" fill={reacted ? "#FF8FAF" : "#EBA8BB"} opacity="0.7"/>
        <ellipse cx="42" cy="21" rx="3.5" ry="4.5" fill={reacted ? "#FF8FAF" : "#EBA8BB"} opacity="0.7"/>
        {/* 얼굴 */}
        <ellipse cx="28" cy="32" rx="19" ry="18" fill={reacted ? "#FFB6CC" : "#F5C8D4"} stroke={reacted ? "#E8809A" : "#D4A0B0"} strokeWidth="1.2"/>
        {/* 볼터치 */}
        <ellipse cx="18" cy="35" rx="5" ry="3.5" fill={reacted ? "#FF8FAF" : "#EBA8BB"} opacity="0.5"/>
        <ellipse cx="38" cy="35" rx="5" ry="3.5" fill={reacted ? "#FF8FAF" : "#EBA8BB"} opacity="0.5"/>
        {/* 코 */}
        <ellipse cx="28" cy="36" rx="6" ry="4.5" fill={reacted ? "#FF8FAF" : "#EBA8BB"} opacity="0.8"/>
        <circle cx="25.5" cy="36" r="1.5" fill={reacted ? "#CC4477" : "#AA6080"} opacity="0.6"/>
        <circle cx="30.5" cy="36" r="1.5" fill={reacted ? "#CC4477" : "#AA6080"} opacity="0.6"/>
        {/* 눈 */}
        <ellipse cx="21" cy="28" rx="2.5" ry="2.8" fill="#111"/>
        <ellipse cx="35" cy="28" rx="2.5" ry="2.8" fill="#111"/>
        <circle cx="22" cy="27" r="0.9" fill="white"/>
        <circle cx="36" cy="27" r="0.9" fill="white"/>
        {/* 웃는 입 */}
        {reacted
          ? <path d="M22 41 Q28 47 34 41" stroke="#CC4477" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          : <path d="M23 41 Q28 44 33 41" stroke="#AA6080" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        }
      </svg>
    </button>
  );
}

function FeedCard({ record: r, isMe }: { record: Record; isMe: boolean }) {
  const [reacted, setReacted] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);

  function handleReact() {
    if (reacted) { setReacted(false); setBubble(null); return; }
    const msg = PIG_REACTIONS[Math.floor(Math.random() * PIG_REACTIONS.length)];
    setReacted(true);
    setBubble(msg);
    setTimeout(() => setBubble(null), 2200);
  }

  return (
    <div className="feed-card">
      {/* 상단: 닉네임 + 시간 */}
      <div className="feed-card-header">
        <span className="feed-card-nickname">
          {r.nickname}{isMe && <span className="feed-me-badge">나</span>}
        </span>
        <span className="feed-card-time">{formatTime(r.created_at)}</span>
      </div>
      {/* 내부 회색 카드 */}
      <div className="feed-card-body">
        <div className="feed-card-info">
          <p className="feed-card-situation">{r.situation ?? r.memo ?? "절약 기록"}</p>
          <p className="feed-card-amount">{r.amount.toLocaleString()}원</p>
        </div>
        <div className="feed-card-pig-wrap">
          {bubble && <div className="pig-bubble" key={bubble + Date.now()}>{bubble}</div>}
          <PigSketch reacted={reacted} onClick={handleReact} />
        </div>
      </div>
    </div>
  );
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [group,   setGroup]   = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [tab,     setTab]     = useState<"feed" | "stats">("feed");
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  const myNickname = getProfile()?.nickname ?? "";

  useEffect(() => {
    async function load() {
      // 3개 쿼리 동시에 실행 (순차 → 병렬)
      const [{ data: g }, { data: m }, { data: r }] = await Promise.all([
        supabase.from("groups").select("*").eq("id", id).single(),
        supabase.from("group_members").select("*").eq("group_id", id).order("joined_at"),
        supabase.from("records").select("*").eq("group_id", id).order("created_at", { ascending: false }),
      ]);

      if (!g) { router.replace("/friends"); return; }
      setGroup(g);
      setMembers(m ?? []);
      setRecords(r ?? []);
      setLoading(false);
    }
    load();

    // 실시간 새 기록 구독
    const sub = supabase
      .channel(`group-${id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "records",
        filter: `group_id=eq.${id}`
      }, payload => setRecords(prev => [payload.new as Record, ...prev]))
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [id]);

  const memberStats = members.map(m => ({
    nickname: m.nickname,
    total: records.filter(r => r.nickname === m.nickname).reduce((s, r) => s + r.amount, 0),
  })).sort((a, b) => b.total - a.total);

  function copyCode() {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100svh" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #F1F1F5", borderTopColor: "#FF2A7A", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* 상태바 여백 (UI 없이 여백만) */}
        <div className="status-bar" />

        {/* 헤더 */}
        <header className="page-header">
          <button className="back-btn" onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="page-title">{group?.name}</h1>
          <div style={{ width: 36 }} />
        </header>

        {/* 탭 */}
        <div className="tab-bar">
          <button className={`tab ${tab === "feed" ? "tab--active" : ""}`} onClick={() => setTab("feed")}>
            실시간 절약 피드
          </button>
          <button className={`tab ${tab === "stats" ? "tab--active" : ""}`} onClick={() => setTab("stats")}>
            절약 통계
          </button>
        </div>

        {/* 콘텐츠 */}
        <main className="content">
          {tab === "feed" ? (
            records.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🐷</p>
                <p className="empty-title">아직 기록이 없어요</p>
                <p className="empty-sub">홈에서 절약 기록을 추가해보세요!</p>
              </div>
            ) : (
              <div className="feed-list">
                {records.map(r => (
                  <FeedCard key={r.id} record={r} isMe={r.nickname === myNickname} />
                ))}
              </div>
            )
          ) : (
            <div className="stats-list">
              {memberStats.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-icon">📊</p>
                  <p className="empty-title">아직 기록이 없어요</p>
                </div>
              ) : (
                memberStats.map((m, i) => (
                  <div key={m.nickname} className="stats-item">
                    <div className="stats-rank">{i === 0 ? "👑" : `${i + 1}`}</div>
                    <div className="stats-info">
                      <span className="stats-nickname">
                        {m.nickname}
                        {m.nickname === myNickname ? " (나)" : ""}
                      </span>
                      <div className="stats-bar-wrap">
                        <div className="stats-bar" style={{
                          width: memberStats[0].total > 0
                            ? `${(m.total / memberStats[0].total) * 100}%` : "0%"
                        }} />
                      </div>
                    </div>
                    <span className="stats-amount">{m.total.toLocaleString()}원</span>
                  </div>
                ))
              )}
            </div>
          )}
          <div style={{ height: 32 }} />
        </main>

        {/* 하단 네비 */}
        <nav className="bottom-nav">
          <Link href="/" className="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3L21 9.5V20a1 1 0 0 1-1 1H15v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/>
            </svg>
            <span>홈</span>
          </Link>
          <Link href="/friends" className="nav-item nav-item--active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="7" r="4"/>
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
            </svg>
            <span>그룹</span>
          </Link>
        </nav>
        <div className="home-indicator"><div className="home-pill" /></div>
      </div>
    </>
  );
}

const css = `
  .shell {
    width: 100%; max-width: 402px; height: 100svh; margin: 0 auto;
    background: #fff; display: flex; flex-direction: column;
    overflow: hidden; font-family: 'Pretendard', -apple-system, sans-serif; position: relative;
  }
  .status-bar { height: 44px; flex-shrink: 0; }
  .page-header {
    height: 56px; padding: 0 16px; display: flex; align-items: center;
    justify-content: space-between; flex-shrink: 0; border-bottom: 1px solid #F1F1F5; gap: 8px;
  }
  .back-btn {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer; color: #111; flex-shrink: 0;
  }
  .page-title { font-size: 17px; font-weight: 700; color: #111; flex: 1; text-align: center; letter-spacing: -0.02em; }
  .share-btn {
    height: 32px; padding: 0 12px; background: #FF2A7A; color: #fff;
    font-family: 'Pretendard', sans-serif; font-size: 12px; font-weight: 700;
    border: none; border-radius: 100px; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  }
  .tab-bar { display: flex; border-bottom: 1px solid #F1F1F5; flex-shrink: 0; }
  .tab {
    flex: 1; height: 46px; background: none; border: none; cursor: pointer;
    font-family: 'Pretendard', sans-serif; font-size: 14px; font-weight: 600;
    color: #BBBBBB; border-bottom: 2px solid transparent; transition: all 0.15s;
  }
  .tab--active { color: #111; border-bottom-color: #111; font-weight: 700; }
  .content { flex: 1; overflow-y: auto; scrollbar-width: none; }
  .content::-webkit-scrollbar { display: none; }
  /* ── 피드 카드 ── */
  .feed-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 20px; }

  /* 외부: 닉네임+시간 + 내부카드 묶음 */
  .feed-card {
    display: flex; flex-direction: column; gap: 12px;
    background: #FFF; border: 0.7px solid #E5E5EC;
    border-radius: 16px;
    padding: 16.7px 16.7px 17px 16.7px;
  }
  .feed-card-header {
    display: flex; align-items: center; justify-content: space-between;
  }
  .feed-card-nickname {
    font-size: 16px; font-weight: 600; color: #111;
    display: flex; align-items: center; gap: 6px; letter-spacing: -0.025em;
  }
  .feed-me-badge {
    font-size: 10px; font-weight: 600; color: #FF2A7A;
    background: #FFE8F2; padding: 2px 7px; border-radius: 100px;
  }
  .feed-card-time { font-size: 13px; color: #999; font-weight: 500; letter-spacing: -0.02em; }

  /* 내부 회색 카드 */
  .feed-card-body {
    background: #FAFAFA;
    border-radius: 12px;
    padding: 14px;
    display: flex; align-items: center; justify-content: space-between;
    min-height: 90px; position: relative;
  }
  .feed-card-info {
    display: flex; flex-direction: column; gap: 6px;
  }
  .feed-card-situation {
    font-size: 15px; font-weight: 600; color: #111; letter-spacing: -0.025em;
  }
  .feed-card-amount {
    font-size: 24px; font-weight: 700; color: #565656; letter-spacing: -0.025em;
  }
  .feed-card-pig-wrap {
    position: relative; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }

  /* ── 돼지 리액션 버튼 ── */
  .pig-btn {
    background: #F5F0EE; border: none; border-radius: 50%;
    width: 67px; height: 64px; cursor: pointer; padding: 4px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 4px rgba(0,0,0,0.05);
    transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
    -webkit-tap-highlight-color: transparent;
  }
  .pig-btn:active { transform: scale(0.88); }
  @keyframes pig-pop {
    0%   { transform: scale(1); }
    30%  { transform: scale(1.2) rotate(-6deg); }
    60%  { transform: scale(0.93) rotate(3deg); }
    100% { transform: scale(1); }
  }
  .pig-btn--reacted { animation: pig-pop 0.38s cubic-bezier(0.34,1.56,0.64,1); }

  /* ── 말풍선 (피그마: #FFDBDD, 아래 삼각형) ── */
  @keyframes bubble-fade {
    0%   { opacity: 0; transform: scale(0.8); }
    15%  { opacity: 1; transform: scale(1.05); }
    25%  { transform: scale(1); }
    80%  { opacity: 1; }
    100% { opacity: 0; }
  }
  .pig-bubble {
    position: absolute; bottom: calc(100% + 4px); left: 50%;
    transform: translateX(-50%);
    background: #FFDBDD; color: #111;
    font-size: 13px; font-weight: 400; white-space: nowrap;
    padding: 4px 14px; border-radius: 100px;
    animation: bubble-fade 2.2s ease forwards;
    pointer-events: none; z-index: 10; letter-spacing: -0.01em;
  }
  .pig-bubble::after {
    content: ""; position: absolute; top: 100%; left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid #FFDBDD;
  }
  .stats-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
  .stats-item { display: flex; align-items: center; gap: 12px; }
  .stats-rank { width: 28px; font-size: 16px; text-align: center; flex-shrink: 0; }
  .stats-info { flex: 1; min-width: 0; }
  .stats-nickname { font-size: 14px; font-weight: 600; color: #111; display: block; margin-bottom: 6px; }
  .stats-bar-wrap { height: 6px; background: #F1F1F5; border-radius: 100px; overflow: hidden; }
  .stats-bar { height: 100%; background: #FF2A7A; border-radius: 100px; transition: width 0.5s ease; min-width: 4px; }
  .stats-amount { font-size: 14px; font-weight: 700; color: #111; white-space: nowrap; flex-shrink: 0; }
  .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 32px; gap: 10px; }
  .empty-icon { font-size: 48px; }
  .empty-title { font-size: 16px; font-weight: 700; color: #111; }
  .empty-sub { font-size: 13px; color: #767676; text-align: center; }
  .bottom-nav {
    height: 64px; display: flex; align-items: center; background: #fff;
    border-top: 1px solid #F1F1F5; flex-shrink: 0; padding: 0 40px;
  }
  .nav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    background: none; border: none; cursor: pointer;
    font-family: 'Pretendard', sans-serif; font-size: 10px; font-weight: 600;
    color: #CCCCCC; padding: 0; text-decoration: none;
  }
  .nav-item svg { stroke: #CCCCCC; }
  .nav-item--active { color: #FF2A7A; }
  .nav-item--active svg { stroke: #FF2A7A; }
  .home-indicator { height: 34px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .home-pill { width: 134px; height: 5px; background: #111; border-radius: 3px; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
