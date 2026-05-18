"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRecords, type PiggyRecord } from "../../page";

// ─── 타입 ────────────────────────────────────────────
interface PiggyGroup {
  id: string;
  name: string;
  createdAt: string;
}

interface FeedItem {
  id: string;
  memberId: string;
  memberName: string;
  memberEmoji: string;
  situation: string;
  amount: number;
  createdAt: string;
  isMe: boolean;
}

interface RankMember {
  id: string;
  name: string;
  emoji: string;
  todaySaved: number;
  isMe: boolean;
}

// ─── 스티커 리액션 문구 ──────────────────────────────
const REACTIONS = [
  "독하다독해! 💪",
  "재벌 마인드 🤑",
  "부자되세요 🙏",
  "절약왕 👑",
  "존경합니다 🫡",
  "진짜 독해 ㄷㄷ",
  "나도 해야하는데...",
  "내 정신력 좀 나눠줘요 😭",
  "이게 맞지 이게 맞아 ✊",
  "현명한 소비생활 👏",
];

// ─── 더미 멤버 (프로토타입용) ─────────────────────────
const todayStr = new Date().toDateString();
const h = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
const MOCK_MEMBERS: Omit<RankMember, "isMe">[] = [
  { id: "mock1", name: "예은", emoji: "🌸", todaySaved: 18000 },
  { id: "mock2", name: "철수", emoji: "🦁", todaySaved: 8000  },
  { id: "mock3", name: "민지", emoji: "🐰", todaySaved: 0     },
];
const MOCK_FEED: Omit<FeedItem, "isMe">[] = [
  { id: "mf1", memberId: "mock1", memberName: "예은", memberEmoji: "🌸", situation: "택시 참기",   amount: 12000, createdAt: h(0.5) },
  { id: "mf2", memberId: "mock2", memberName: "철수", memberEmoji: "🦁", situation: "배달 참기",   amount: 8000,  createdAt: h(1.2) },
  { id: "mf3", memberId: "mock1", memberName: "예은", memberEmoji: "🌸", situation: "커피 참기",   amount: 6000,  createdAt: h(2.0) },
  { id: "mf4", memberId: "mock2", memberName: "철수", memberEmoji: "🦁", situation: "쇼핑 참기",   amount: 15000, createdAt: h(3.5) },
  { id: "mf5", memberId: "mock3", memberName: "민지", memberEmoji: "🐰", situation: "간식 참기",   amount: 3000,  createdAt: h(5.0) },
];

function formatFeedTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)  return "방금 전";
  if (diff < 60) return `${diff}분 전`;
  return `${Math.floor(diff / 60)}시간 전`;
}

// ─── 그룹 상세 페이지 ────────────────────────────────
export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [group,       setGroup]       = useState<PiggyGroup | null>(null);
  const [tab,         setTab]         = useState<"feed" | "stats">("feed");
  const [feedItems,   setFeedItems]   = useState<FeedItem[]>([]);
  const [rankMembers, setRankMembers] = useState<RankMember[]>([]);
  // stickerId → 현재 표시 중인 리액션 문구
  const [reactions,   setReactions]   = useState<Record<string, string | null>>({});
  // stickerId → 누적 리액션 카운트
  const [stickerCount, setStickerCount] = useState<Record<string, number>>({});

  useEffect(() => {
    // 그룹 불러오기
    try {
      const groups: PiggyGroup[] = JSON.parse(localStorage.getItem("piggy-groups") ?? "[]");
      const found = groups.find(g => g.id === id);
      if (!found) { router.push("/friends"); return; }
      setGroup(found);
    } catch { router.push("/friends"); return; }

    // 내 기록 → 피드 아이템 변환
    const myRecords: PiggyRecord[] = getRecords();
    const myFeed: FeedItem[] = myRecords.map(r => ({
      id: r.id,
      memberId: "me",
      memberName: "나",
      memberEmoji: "🐷",
      situation: r.situation ?? (r.memo || "절약 기록"),
      amount: r.amount,
      createdAt: r.createdAt,
      isMe: true,
    }));

    // 더미 피드 합치기 → 최신순 정렬
    const allFeed: FeedItem[] = [
      ...myFeed,
      ...MOCK_FEED.map(f => ({ ...f, isMe: false })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFeedItems(allFeed);

    // 랭킹: 내 오늘 저축 + 더미 멤버
    const myToday = myRecords
      .filter(r => new Date(r.createdAt).toDateString() === todayStr)
      .reduce((s, r) => s + r.amount, 0);

    const allMembers: RankMember[] = [
      { id: "me", name: "나", emoji: "🐷", todaySaved: myToday, isMe: true },
      ...MOCK_MEMBERS.map(m => ({ ...m, isMe: false })),
    ].sort((a, b) => b.todaySaved - a.todaySaved);
    setRankMembers(allMembers);
  }, [id, router]);

  const handleSticker = (itemId: string) => {
    const text = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    setReactions(prev => ({ ...prev, [itemId]: text }));
    setStickerCount(prev => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
    setTimeout(() => setReactions(prev => ({ ...prev, [itemId]: null })), 2400);
  };

  if (!group) return null;

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* ── 상태바 ── */}
        <div className="status-bar">
          <span className="status-time">9:41</span>
          <div className="status-icons">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0"  y="3" width="3" height="9"  rx="1" fill="#111" />
              <rect x="4"  y="2" width="3" height="10" rx="1" fill="#111" />
              <rect x="8"  y="1" width="3" height="11" rx="1" fill="#111" />
              <rect x="12" y="0" width="3" height="12" rx="1" fill="#111" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 2.5C10.8 2.5 13.3 3.7 15 5.7L16 4.5C14 2.2 11.2 0.8 8 0.8C4.8 0.8 2 2.2 0 4.5L1 5.7C2.7 3.7 5.2 2.5 8 2.5Z" fill="#111"/>
              <path d="M8 5.5C9.9 5.5 11.6 6.3 12.8 7.6L14 6.4C12.4 4.8 10.3 3.8 8 3.8C5.7 3.8 3.6 4.8 2 6.4L3.2 7.6C4.4 6.3 6.1 5.5 8 5.5Z" fill="#111"/>
              <circle cx="8" cy="11" r="1.5" fill="#111"/>
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0" y="1" width="21" height="10" rx="3" stroke="#111" strokeWidth="1"/>
              <rect x="1.5" y="2.5" width="15" height="7" rx="2" fill="#111"/>
              <path d="M22.5 4v4a2 2 0 0 0 0-4z" fill="#111"/>
            </svg>
          </div>
        </div>

        {/* ── 헤더: ← + 그룹명 ── */}
        <header className="page-header">
          <button className="back-btn" onClick={() => router.push("/friends")} aria-label="뒤로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </button>
          <div className="header-center">
            <span className="group-name">{group.name}</span>
            <span className="member-badge">{rankMembers.length}명</span>
          </div>
        </header>

        {/* ── 탭 ── */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === "feed" ? "tab-btn--active" : ""}`}
            onClick={() => setTab("feed")}
          >
            실시간 절약 피드
          </button>
          <button
            className={`tab-btn ${tab === "stats" ? "tab-btn--active" : ""}`}
            onClick={() => setTab("stats")}
          >
            절약 통계
          </button>
        </div>

        {/* ── 콘텐츠 ── */}
        <main className="content">

          {/* ── 피드 탭 ── */}
          {tab === "feed" && (
            <div className="feed-list">
              {feedItems.length === 0 ? (
                <div className="empty-feed">
                  <span className="empty-feed-icon">🐷</span>
                  <p className="empty-feed-title">아직 기록이 없어요</p>
                  <p className="empty-feed-sub">첫 절약을 기록하고 친구에게 자랑해보세요!</p>
                </div>
              ) : (
                feedItems.map(item => (
                  <div key={item.id} className={`feed-card ${item.isMe ? "feed-card--mine" : ""}`}>
                    {/* 카드 헤더 */}
                    <div className="feed-card-header">
                      <div className="feed-avatar">{item.memberEmoji}</div>
                      <div className="feed-member-info">
                        <span className="feed-member-name">
                          {item.memberName}
                          {item.isMe && <span className="feed-me-badge">나</span>}
                        </span>
                        <span className="feed-time">{formatFeedTime(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* 카드 본문 */}
                    <div className="feed-card-body">
                      <div className="feed-save-info">
                        <span className="feed-situation">{item.situation}</span>
                        <span className="feed-amount">+{item.amount.toLocaleString()}원</span>
                      </div>

                      {/* 돼지 스티커 버튼 */}
                      <div className="sticker-wrap">
                        {reactions[item.id] && (
                          <div className="reaction-bubble">
                            <span>{reactions[item.id]}</span>
                            <div className="reaction-bubble-tail" />
                          </div>
                        )}
                        <button
                          className={`sticker-btn ${stickerCount[item.id] ? "sticker-btn--reacted" : ""}`}
                          onClick={() => handleSticker(item.id)}
                          aria-label="칭찬 스티커"
                        >
                          🐷
                          {(stickerCount[item.id] ?? 0) > 0 && (
                            <span className="sticker-count">{stickerCount[item.id]}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div style={{ height: 40 }} />
            </div>
          )}

          {/* ── 통계 탭 ── */}
          {tab === "stats" && (
            <div className="stats-wrap">

              {/* 1위 하이라이트 카드 */}
              {rankMembers.length > 0 && (() => {
                const top = rankMembers[0];
                return (
                  <div className="rank1-card">
                    <div className="rank1-crown">👑</div>
                    <div className="rank1-avatar">{top.emoji}</div>
                    <div className="rank1-name">
                      {top.name}
                      {top.isMe && <span className="rank1-me-badge">나</span>}
                    </div>
                    <div className="rank1-amount">
                      {top.todaySaved > 0
                        ? `${top.todaySaved.toLocaleString()}원`
                        : "0원"}
                    </div>
                    <div className="rank1-label">오늘의 절약왕 🎉</div>
                  </div>
                );
              })()}

              {/* 2위~ 랭킹 목록 */}
              <div className="rank-list">
                {rankMembers.slice(1).map((m, i) => (
                  <div key={m.id} className="rank-item">
                    <span className="rank-no">{i + 2}</span>
                    <span className="rank-emoji">{m.emoji}</span>
                    <div className="rank-info">
                      <span className="rank-name">
                        {m.name}
                        {m.isMe && <span className="rank-me-badge">나</span>}
                      </span>
                      <div className="rank-bar-wrap">
                        <div
                          className="rank-bar"
                          style={{
                            width: rankMembers[0].todaySaved > 0
                              ? `${(m.todaySaved / rankMembers[0].todaySaved) * 100}%`
                              : "0%"
                          }}
                        />
                      </div>
                    </div>
                    <span className={`rank-amount ${m.todaySaved === 0 ? "rank-amount--zero" : ""}`}>
                      {m.todaySaved > 0 ? `${m.todaySaved.toLocaleString()}원` : "0원"}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ height: 40 }} />
            </div>
          )}

        </main>

        {/* ── 홈 인디케이터 ── */}
        <div className="home-indicator">
          <div className="home-pill" />
        </div>

      </div>
    </>
  );
}

// ─── 스타일 ─────────────────────────────────────────
const css = `
  /* ── 앱 셸 ── */
  .shell {
    width: 100%;
    max-width: 402px;
    height: 100svh;
    margin: 0 auto;
    background: #F7F7F7;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── 상태바 ── */
  .status-bar {
    height: 44px;
    padding: 14px 20px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    background: #FFFFFF;
  }
  .status-time { font-size: 15px; font-weight: 700; color: #111; letter-spacing: -0.02em; }
  .status-icons { display: flex; align-items: center; gap: 6px; }

  /* ── 헤더 ── */
  .page-header {
    height: 56px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    background: #FFFFFF;
    border-bottom: 1px solid #F1F1F5;
  }
  .back-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F1F5;
    border: none;
    border-radius: 50%;
    color: #111;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .back-btn:active { background: #E5E5EC; }
  .header-center {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .group-name {
    font-size: 17px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.03em;
  }
  .member-badge {
    font-size: 11px;
    font-weight: 600;
    color: #767676;
    background: #F1F1F5;
    padding: 2px 8px;
    border-radius: 100px;
  }

  /* ── 탭 바 ── */
  .tab-bar {
    display: flex;
    background: #FFFFFF;
    border-bottom: 1px solid #F1F1F5;
    flex-shrink: 0;
    padding: 0 4px;
  }
  .tab-btn {
    flex: 1;
    height: 44px;
    background: none;
    border: none;
    border-bottom: 2.5px solid transparent;
    font-family: 'Pretendard', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #BBBBBB;
    letter-spacing: -0.02em;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
    margin-bottom: -1px;
  }
  .tab-btn--active {
    color: #111111;
    border-bottom-color: #111111;
    font-weight: 700;
  }

  /* ── 스크롤 콘텐츠 ── */
  .content {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .content::-webkit-scrollbar { display: none; }

  /* ── 피드 빈 상태 ── */
  .empty-feed {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 24px;
    gap: 10px;
  }
  .empty-feed-icon { font-size: 48px; animation: bounce 1.6s ease-in-out infinite; }
  .empty-feed-title { font-size: 17px; font-weight: 700; color: #111; letter-spacing: -0.03em; }
  .empty-feed-sub { font-size: 13px; color: #767676; text-align: center; line-height: 1.6; }

  /* ── 피드 리스트 ── */
  .feed-list { padding: 12px 16px 0; display: flex; flex-direction: column; gap: 10px; }

  /* ── 피드 카드 ── */
  .feed-card {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    animation: fadeUp 0.3s ease;
  }
  .feed-card--mine {
    border: 1.5px solid #FFE8F2;
    background: #FFFCFE;
  }

  /* 카드 헤더 */
  .feed-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .feed-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #F1F1F5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .feed-member-info { display: flex; flex-direction: column; gap: 2px; }
  .feed-member-name {
    font-size: 14px;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .feed-me-badge {
    font-size: 10px;
    font-weight: 600;
    color: #FF2A7A;
    background: #FFE8F2;
    padding: 1px 6px;
    border-radius: 100px;
  }
  .feed-time { font-size: 12px; color: #BBBBBB; }

  /* 카드 본문 */
  .feed-card-body {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }
  .feed-save-info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
  .feed-situation {
    font-size: 14px;
    font-weight: 500;
    color: #767676;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .feed-amount {
    font-size: 26px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.04em;
    line-height: 1.1;
  }

  /* ── 스티커 버튼 ── */
  .sticker-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }
  .sticker-btn {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    background: #F7F7F7;
    border: 2px solid #E5E5EC;
    font-size: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
    position: relative;
    gap: 1px;
  }
  .sticker-btn:active { transform: scale(0.88); }
  .sticker-btn--reacted {
    background: #FFF0F8;
    border-color: #FF2A7A;
  }
  .sticker-count {
    font-size: 11px;
    font-weight: 700;
    color: #FF2A7A;
    line-height: 1;
    font-family: 'Pretendard', sans-serif;
  }

  /* 리액션 말풍선 */
  .reaction-bubble {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background: #111111;
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Pretendard', sans-serif;
    letter-spacing: -0.01em;
    padding: 7px 12px;
    border-radius: 20px;
    white-space: nowrap;
    z-index: 10;
    animation: bubblePop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    pointer-events: none;
  }
  .reaction-bubble-tail {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 7px solid #111111;
  }

  /* ── 통계 탭 ── */
  .stats-wrap { padding: 16px 16px 0; }

  /* 1위 카드 */
  .rank1-card {
    background: linear-gradient(135deg, #FF2A7A 0%, #FF6BA0 100%);
    border-radius: 24px;
    padding: 28px 20px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-bottom: 16px;
    box-shadow: 0 8px 28px rgba(255, 42, 122, 0.30);
    animation: fadeUp 0.35s ease;
  }
  .rank1-crown { font-size: 28px; line-height: 1; margin-bottom: 2px; }
  .rank1-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin-bottom: 4px;
  }
  .rank1-name {
    font-size: 18px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.03em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .rank1-me-badge {
    font-size: 11px;
    background: rgba(255,255,255,0.30);
    color: #FFFFFF;
    padding: 2px 7px;
    border-radius: 100px;
    font-weight: 600;
  }
  .rank1-amount {
    font-size: 32px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.05em;
    line-height: 1.1;
  }
  .rank1-label {
    font-size: 13px;
    color: rgba(255,255,255,0.80);
    letter-spacing: -0.01em;
    margin-top: 2px;
  }

  /* 2위~ 랭킹 목록 */
  .rank-list {
    background: #FFFFFF;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }
  .rank-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #F7F7F7;
    animation: fadeUp 0.3s ease;
  }
  .rank-item:last-child { border-bottom: none; }
  .rank-no {
    font-size: 16px;
    font-weight: 800;
    color: #BBBBBB;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }
  .rank-emoji {
    font-size: 24px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F7F7F7;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .rank-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .rank-name {
    font-size: 14px;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .rank-me-badge {
    font-size: 10px;
    font-weight: 600;
    color: #FF2A7A;
    background: #FFE8F2;
    padding: 1px 6px;
    border-radius: 100px;
  }
  .rank-bar-wrap {
    height: 4px;
    background: #F1F1F5;
    border-radius: 100px;
    overflow: hidden;
  }
  .rank-bar {
    height: 100%;
    background: #E5E5EC;
    border-radius: 100px;
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .rank-amount {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
    flex-shrink: 0;
  }
  .rank-amount--zero { color: #BBBBBB; }

  /* ── 홈 인디케이터 ── */
  .home-indicator {
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #FFFFFF;
  }
  .home-pill {
    width: 134px;
    height: 5px;
    background: #111111;
    border-radius: 3px;
    opacity: 0.18;
  }

  /* ── 키프레임 ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bubblePop {
    from { opacity: 0; transform: translateX(-50%) scale(0.7); }
    to   { opacity: 1; transform: translateX(-50%) scale(1); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }
`;
