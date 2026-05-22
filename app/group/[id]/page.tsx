"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getProfile } from "../../onboarding/page";

interface Member { id: string; nickname: string; joined_at: string; }
interface FeedRecord {
  id: string; nickname: string; amount: number;
  situation: string | null; memo: string | null; created_at: string;
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

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [group,   setGroup]   = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<FeedRecord[]>([]);
  const [tab,     setTab]     = useState<"feed" | "stats">("feed");
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  const myNickname = getProfile()?.nickname ?? "";

  useEffect(() => {
    async function fetchRecords() {
      const { data: r } = await supabase
        .from("records")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: false });
      if (r) setRecords(r);
    }

    async function load() {
      const { data: g } = await supabase.from("groups").select("*").eq("id", id).single();
      if (!g) { router.replace("/friends"); return; }
      setGroup(g);

      const { data: m } = await supabase
        .from("group_members").select("*").eq("group_id", id).order("joined_at");
      setMembers(m ?? []);

      await fetchRecords();
      setLoading(false);
    }

    load();

    // 실시간 새 기록/멤버 변경 구독 — 이벤트 수신 시 전체 재조회 (피드 + 통계 동시 갱신)
    const sub = supabase
      .channel(`group-${id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "records",
        filter: `group_id=eq.${id}`,
      }, () => {
        fetchRecords();
      })
      .on("postgres_changes", {
        event: "*", schema: "public", table: "group_members",
        filter: `group_id=eq.${id}`,
      }, async () => {
        const { data: m } = await supabase
          .from("group_members").select("*").eq("group_id", id).order("joined_at");
        setMembers(m ?? []);
      })
      .subscribe(status => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime 구독 실패:", status);
        }
      });

    // 폴링 폴백 — Realtime이 작동하지 않을 때 대비 (15초마다)
    const pollId = setInterval(() => {
      if (document.visibilityState === "visible") fetchRecords();
    }, 15000);

    // 페이지 복귀 시 재조회
    const onVisible = () => { if (document.visibilityState === "visible") fetchRecords(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", fetchRecords);

    return () => {
      supabase.removeChannel(sub);
      clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", fetchRecords);
    };
  }, [id]);

  // 통계: 멤버 전원 포함, 기록 없는 멤버는 0원
  const memberStats = members
    .map(m => ({
      nickname: m.nickname,
      total: records.filter(r => r.nickname === m.nickname).reduce((s, r) => s + r.amount, 0),
    }))
    .sort((a, b) => b.total - a.total);

  const topTotal = memberStats[0]?.total ?? 0;

  function copyCode() {
    if (!group) return;
    const markCopied = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const fallback = () => {
      const el = document.createElement("textarea");
      el.value = group.invite_code;
      el.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(el);
      el.focus(); el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      markCopied();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(group.invite_code).then(markCopied).catch(fallback);
    } else {
      fallback();
    }
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

        {/* 상태바 */}
        <div className="status-bar">
          <span className="status-time">9:41</span>
          <div className="status-icons">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0"  y="3" width="3" height="9"  rx="1" fill="#111" />
              <rect x="4"  y="2" width="3" height="10" rx="1" fill="#111" />
              <rect x="8"  y="1" width="3" height="11" rx="1" fill="#111" />
              <rect x="12" y="0" width="3" height="12" rx="1" fill="#111" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0" y="1" width="21" height="10" rx="3" stroke="#111" strokeWidth="1"/>
              <rect x="1.5" y="2.5" width="15" height="7" rx="2" fill="#111"/>
              <path d="M22.5 4v4a2 2 0 0 0 0-4z" fill="#111"/>
            </svg>
          </div>
        </div>

        {/* 헤더 */}
        <header className="page-header">
          <button className="back-btn" onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="page-title">{group?.name}</h1>
          <button className="share-btn" onClick={copyCode}>
            {copied ? "복사됨 ✓" : `코드: ${group?.invite_code}`}
          </button>
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

        {/* 피드 탭 */}
        {tab === "feed" && (
          <main className="content">
            {records.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🐷</p>
                <p className="empty-title">아직 기록이 없어요</p>
                <p className="empty-sub">홈에서 절약 기록을 추가해보세요!</p>
              </div>
            ) : (
              <div className="feed-list">
                {records.map(r => (
                  <div key={r.id} className="feed-card">
                    <div className="feed-card-top">
                      <span className="feed-nickname">
                        {r.nickname}
                        {r.nickname === myNickname && <span className="feed-me-badge">나</span>}
                      </span>
                      <span className="feed-time">{formatTime(r.created_at)}</span>
                    </div>
                    <div className="feed-card-body">
                      <div className="feed-card-left">
                        {r.situation && (
                          <span className="feed-tag">독하다독해</span>
                        )}
                        {(r.situation || r.memo) && (
                          <p className="feed-situation">{r.situation ?? r.memo}</p>
                        )}
                        <p className="feed-amount">{r.amount.toLocaleString()}원</p>
                      </div>
                      <div className="feed-pig">🐷</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: 32 }} />
          </main>
        )}

        {/* 통계 탭 */}
        {tab === "stats" && (
          <main className="content">
            {memberStats.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">📊</p>
                <p className="empty-title">아직 기록이 없어요</p>
              </div>
            ) : (
              <div className="stats-list">
                {memberStats.map((m, i) => {
                  const isFirst = i === 0 && m.total > 0;
                  const isZero  = m.total === 0;
                  return (
                    <div key={m.nickname} className={`stats-card ${isFirst ? "stats-card--first" : ""} ${isZero ? "stats-card--zero" : ""}`}>
                      {isFirst && (
                        <div className="stats-avatar">
                          <span className="stats-avatar-letter">{m.nickname.charAt(0)}</span>
                        </div>
                      )}
                      <div className="stats-info">
                        <span className="stats-nickname">{m.nickname}{m.nickname === myNickname ? " (나)" : ""}</span>
                        <span className={`stats-amount ${isFirst ? "stats-amount--first" : ""} ${isZero ? "stats-amount--zero" : ""}`}>
                          {m.total.toLocaleString()}원
                        </span>
                      </div>
                      {isFirst && <span className="stats-crown">👑</span>}
                      {!isFirst && !isZero && (
                        <div className="stats-bar-wrap">
                          <div className="stats-bar" style={{ width: topTotal > 0 ? `${(m.total / topTotal) * 100}%` : "0%" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ height: 32 }} />
          </main>
        )}

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
    overflow: hidden; font-family: 'Pretendard', -apple-system, sans-serif;
  }
  .status-bar { height: 44px; padding: 14px 20px 0; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .status-time { font-size: 15px; font-weight: 700; color: #111; }
  .status-icons { display: flex; align-items: center; gap: 6px; }
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

  /* ── 피드 ── */
  .feed-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
  .feed-card {
    background: #fff; border: 1px solid #F1F1F5; border-radius: 16px;
    padding: 16px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .feed-card-top {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  }
  .feed-nickname { font-size: 14px; font-weight: 700; color: #111; display: flex; align-items: center; gap: 6px; }
  .feed-me-badge {
    font-size: 10px; font-weight: 600; color: #FF2A7A;
    background: #FFE8F2; padding: 1px 6px; border-radius: 100px;
  }
  .feed-time { font-size: 12px; color: #BBBBBB; }
  .feed-card-body { display: flex; align-items: flex-end; justify-content: space-between; }
  .feed-card-left { display: flex; flex-direction: column; gap: 4px; }
  .feed-tag {
    display: inline-block; font-size: 11px; font-weight: 700; color: #FF2A7A;
    background: #FFE8F2; padding: 3px 10px; border-radius: 100px; width: fit-content;
  }
  .feed-situation { font-size: 13px; color: #555; margin: 0; }
  .feed-amount { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }
  .feed-pig { font-size: 40px; line-height: 1; }

  /* ── 통계 ── */
  .stats-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
  .stats-card {
    background: #fff; border: 1px solid #F1F1F5; border-radius: 16px;
    padding: 16px 18px; display: flex; align-items: center; gap: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04); position: relative;
  }
  .stats-card--first {
    background: #111; border-color: #111;
  }
  .stats-card--zero { background: #FAFAFA; border-color: #F1F1F5; box-shadow: none; }
  .stats-avatar {
    width: 48px; height: 48px; border-radius: 50%; background: #444;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .stats-avatar-letter { font-size: 20px; font-weight: 700; color: #fff; }
  .stats-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .stats-nickname { font-size: 14px; font-weight: 600; color: #111; }
  .stats-card--first .stats-nickname { color: #fff; }
  .stats-card--zero .stats-nickname { color: #BBBBBB; }
  .stats-amount { font-size: 20px; font-weight: 800; color: #111; letter-spacing: -0.03em; }
  .stats-amount--first { color: #fff; font-size: 24px; }
  .stats-amount--zero { color: #CCCCCC; font-size: 18px; }
  .stats-crown { font-size: 22px; position: absolute; top: 12px; right: 16px; }
  .stats-bar-wrap {
    position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
    background: #F1F1F5; border-radius: 0 0 16px 16px; overflow: hidden;
  }
  .stats-bar { height: 100%; background: #FF2A7A; border-radius: 0 0 16px 16px; transition: width 0.6s ease; }

  /* ── 공통 ── */
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
