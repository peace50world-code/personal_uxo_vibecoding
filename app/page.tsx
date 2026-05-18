"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, isLoggedIn } from "./onboarding/page";

// ─── 공유 데이터 타입 ─────────────────────────────────
export interface PiggyRecord {
  id: string;
  amount: number;
  situation: string | null;
  memo: string;
  createdAt: string;
}

export const STORAGE_KEY = "piggy-records";

export function getRecords(): PiggyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

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

// ─── 누적 금액별 돼지 상태 ───────────────────────────
const PIGGY_STATES = [
  {
    max: 0,
    mood: "empty",
    label: "아직 저금통이 비어있어요",
    sub: "참은 소비를 기록하면 돼지가 자라요!",
  },
  {
    max: 10_000,
    mood: "hungry",
    label: "배고픈 돼지에요...",
    sub: "조금씩 채워지고 있어요 🌱",
  },
  {
    max: 20_000,
    mood: "happy",
    label: "통통해지고 있어요!",
    sub: "오늘도 잘 참고 있어요 💕",
  },
  {
    max: Infinity,
    mood: "rich",
    label: "황금 부자 돼지 등장! 👑",
    sub: "절약왕이 되셨어요 🎉",
  },
];

function getPiggyState(total: number) {
  return PIGGY_STATES.find((s) => total <= s.max) ?? PIGGY_STATES[3];
}

// ─── 돼지 SVG (상태별) ───────────────────────────────
function PiggyIllustration({ mood }: { mood: string }) {
  const fills = {
    empty:  { body: "#E5E5EC", cheek: "#D0D0D8", eye: "#999999", bg: "#F7F7F7" },
    hungry: { body: "#F5C8D4", cheek: "#EBA8BB", eye: "#111111", bg: "#FFF5F8" },
    happy:  { body: "#FFB6CC", cheek: "#FF8FAF", eye: "#111111", bg: "#FFF0F5" },
    rich:   { body: "#FFD700", cheek: "#FFC000", eye: "#111111", bg: "#FFFBE6" },
  }[mood] ?? { body: "#E5E5EC", cheek: "#D0D0D8", eye: "#999999", bg: "#F7F7F7" };

  const isRich  = mood === "rich";
  const isHappy = mood === "happy" || mood === "rich";
  const isEmpty = mood === "empty";

  return (
    <div
      className="piggy-wrap"
      style={{ background: fills.bg }}
      aria-label="돼지저금통 캐릭터 (3D 에셋 삽입 예정)"
    >
      <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {isRich && (
          <g>
            <polygon points="42,42 52,28 62,38 72,24 82,38 92,28 100,42"
              fill="#FFD700" stroke="#F0A800" strokeWidth="1.5" strokeLinejoin="round"/>
            <rect x="40" y="40" width="62" height="8" rx="3" fill="#FFD700" stroke="#F0A800" strokeWidth="1"/>
          </g>
        )}
        <ellipse cx="36" cy="58" rx="14" ry="16" fill={fills.body} />
        <ellipse cx="36" cy="59" rx="8"  ry="10" fill={fills.cheek} opacity="0.6" />
        <ellipse cx="106" cy="58" rx="14" ry="16" fill={fills.body} />
        <ellipse cx="106" cy="59" rx="8"  ry="10" fill={fills.cheek} opacity="0.6" />
        <ellipse cx="71" cy="90" rx="48" ry="44" fill={fills.body} />
        <ellipse cx="55" cy="72" rx="12" ry="7" fill="white" opacity={isEmpty ? 0.2 : 0.35} />
        <rect x="58" y="50" width="26" height="5" rx="2.5"
          fill={isEmpty ? "#BBBBBB" : "#AA6080"} opacity={isEmpty ? 0.5 : 0.6} />
        <circle cx="56" cy="80" r={isEmpty ? 4 : 5} fill={fills.eye} />
        <circle cx="86" cy="80" r={isEmpty ? 4 : 5} fill={fills.eye} />
        {!isEmpty && (
          <>
            <circle cx="58" cy="78" r="1.5" fill="white" />
            <circle cx="88" cy="78" r="1.5" fill="white" />
          </>
        )}
        <ellipse cx="71" cy="95" rx="14" ry="10" fill={fills.cheek} opacity="0.7" />
        <circle cx="66" cy="95" r="3" fill={fills.body} opacity="0.6" />
        <circle cx="76" cy="95" r="3" fill={fills.body} opacity="0.6" />
        {isHappy ? (
          <path d="M59 107 Q71 118 83 107" stroke={isRich ? "#CC8800" : "#CC4477"}
            strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          <path d={isEmpty ? "M60 112 Q71 104 82 112" : "M61 108 Q71 108 81 108"}
            stroke="#AAAAAA" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        )}
        <path d="M118 88 Q128 80 124 68 Q120 56 130 50"
          stroke={fills.body} strokeWidth="6" strokeLinecap="round" fill="none" />
        <ellipse cx="51" cy="130" rx="10" ry="6" fill={fills.cheek} opacity="0.8" />
        <ellipse cx="91" cy="130" rx="10" ry="6" fill={fills.cheek} opacity="0.8" />
        {isRich && (
          <g fill="#FFD700" opacity="0.85">
            <text x="20"  y="52" fontSize="14">✨</text>
            <text x="108" y="50" fontSize="12">⭐</text>
            <text x="14"  y="108" fontSize="10">💫</text>
          </g>
        )}
      </svg>
      <span className="piggy-badge">3D 에셋 삽입 예정</span>
    </div>
  );
}

// ─── 홈 페이지 ──────────────────────────────────────
export default function HomePage() {
  const router  = useRouter();
  const [ready,   setReady]   = useState(false);
  const [records, setRecords] = useState<PiggyRecord[]>([]);
  const [nickname, setNickname] = useState("");

  // 인증 가드 + 데이터 로드
  useEffect(() => {
    const profile = getProfile();
    if (!profile || !isLoggedIn()) {
      router.replace("/onboarding");
      return;
    }
    setNickname(profile.nickname);
    setReady(true);

    const load = () => setRecords(getRecords());
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [router]);

  if (!ready) return null;

  const totalSaved: number = records.reduce((s, r) => s + r.amount, 0);
  const todayStr = new Date().toDateString();
  const todaySaved: number = records
    .filter(r => new Date(r.createdAt).toDateString() === todayStr)
    .reduce((s, r) => s + r.amount, 0);
  const recentRecords = records.slice(0, 5);

  const piggy = getPiggyState(totalSaved);

  return (
    <>
      <style>{css}</style>

      <div className="shell">

        {/* ── 상태바 (iOS 시뮬레이션) ── */}
        <div className="status-bar">
          <span className="status-time">9:41</span>
          <div className="status-icons">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0"  y="3" width="3" height="9" rx="1" fill="#111" />
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

        {/* ── GNB 헤더 ── */}
        <header className="gnb">
          <span className="gnb-logo">참으면돼지</span>
          <span className="gnb-nickname">{nickname}님 👋</span>
          <div className="gnb-right">
            <button className="gnb-icon-btn" aria-label="알림">
              <span className="notif-dot" />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <button className="gnb-icon-btn" aria-label="프로필">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </button>
          </div>
        </header>

        {/* ── 스크롤 콘텐츠 ── */}
        <main className="content">

          {/* 돼지 캐릭터 + 상태 메시지 */}
          <section className="piggy-section">
            <PiggyIllustration mood={piggy.mood} />
            <p className="piggy-label">{piggy.label}</p>
            <p className="piggy-sub">{piggy.sub}</p>
          </section>

          {/* 오늘 참은 금액 카드 */}
          <section className="today-card">
            <p className="today-card-label">오늘 참은 금액</p>
            <p className="today-card-amount">
              {todaySaved === 0 ? (
                <span className="amount-zero">0원</span>
              ) : (
                <><span className="amount-value">{todaySaved.toLocaleString()}</span><span className="amount-unit">원</span></>
              )}
            </p>
            {todaySaved === 0 && (
              <p className="today-card-hint">아직 기록이 없어요. 첫 참기에 도전해보세요!</p>
            )}
            {totalSaved > 0 && (
              <p className="total-saved-hint">누적 절약 <strong>{totalSaved.toLocaleString()}원</strong></p>
            )}
          </section>

          {/* 최근 기록 */}
          <section className="recent-section">
            <h2 className="recent-title">최근 기록</h2>

            {recentRecords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🐽</div>
                <p className="empty-text">아직 기록이 없어요</p>
                <p className="empty-sub">
                  아래 <strong>+</strong> 버튼을 눌러<br />
                  첫 번째 참기를 기록해보세요
                </p>
              </div>
            ) : (
              <div className="record-list">
                {recentRecords.map(r => (
                  <div key={r.id} className="record-item">
                    <div className="record-info">
                      <span className="record-label">
                        {r.situation ?? (r.memo || "절약 기록")}
                      </span>
                      <span className="record-time">{formatTime(r.createdAt)}</span>
                    </div>
                    <span className="record-amount">+{r.amount.toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 하단 여백 */}
          <div style={{ height: 98 }} />
        </main>

        {/* ── FAB ── */}
        <Link href="/record" className="fab" aria-label="참은 소비 기록 추가">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </Link>

        {/* ── 하단 네비게이션 ── */}
        <nav className="bottom-nav">
          <Link href="/" className="nav-item nav-item--active" aria-label="홈">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3L21 9.5V20a1 1 0 0 1-1 1H15v-6H9v6H4a1 1 0 0 1-1-1V9.5z"
                fill="#FF2A7A"
              />
            </svg>
            <span>홈</span>
          </Link>

          <Link href="/friends" className="nav-item" aria-label="친구">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="7" r="4"/>
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
            </svg>
            <span>친구</span>
          </Link>
        </nav>

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
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    position: relative;
  }

  /* ── 상태바 (44px) ── */
  .status-bar {
    height: 44px;
    padding: 14px 20px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    background: #FFFFFF;
  }
  .status-time {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
  }
  .status-icons {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── GNB 헤더 (56px) ── */
  .gnb {
    height: 56px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    background: #FFFFFF;
    border-bottom: 1px solid #F1F1F5;
    position: relative;
  }
  .gnb-logo {
    font-size: 18px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.04em;
  }
  .gnb-nickname {
    font-size: 12px;
    font-weight: 600;
    color: #767676;
    letter-spacing: -0.01em;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .gnb-right {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .gnb-icon-btn {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: #111111;
    border-radius: 50%;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s;
  }
  .gnb-icon-btn:active { background: #F1F1F5; }
  .notif-dot {
    position: absolute;
    top: 8px; right: 8px;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #FF2A7A;
    border: 1.5px solid #FFFFFF;
  }

  /* ── 스크롤 콘텐츠 ── */
  .content {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .content::-webkit-scrollbar { display: none; }

  /* ── 돼지 섹션 ── */
  .piggy-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 24px 24px;
    gap: 10px;
  }
  .piggy-wrap {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
    transition: background 0.5s ease;
  }
  .piggy-badge {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    color: #BBBBBB;
    white-space: nowrap;
    background: #FFFFFF;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #E5E5EC;
  }
  .piggy-label {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.03em;
    margin-top: 8px;
    text-align: center;
  }
  .piggy-sub {
    font-size: 13px;
    color: #767676;
    text-align: center;
    letter-spacing: -0.01em;
  }

  /* ── 오늘 참은 금액 카드 ── */
  .today-card {
    margin: 0 20px 20px;
    padding: 20px 22px;
    background: #FFFFFF;
    border: 1.5px solid #E5E5EC;
    border-radius: 20px;
  }
  .today-card-label {
    font-size: 13px;
    font-weight: 500;
    color: #767676;
    letter-spacing: -0.01em;
    margin-bottom: 8px;
  }
  .today-card-amount {
    font-size: 36px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.05em;
    line-height: 1;
    margin-bottom: 10px;
  }
  .amount-zero { color: #D0D0D0; }
  .amount-value { color: #111111; }
  .amount-unit {
    font-size: 22px;
    font-weight: 700;
    margin-left: 2px;
    color: #111111;
  }
  .today-card-hint {
    font-size: 12px;
    color: #BBBBBB;
    letter-spacing: -0.01em;
    line-height: 1.5;
  }
  .total-saved-hint {
    font-size: 12px;
    color: #767676;
    letter-spacing: -0.01em;
    margin-top: 6px;
  }
  .total-saved-hint strong {
    color: #FF2A7A;
    font-weight: 700;
  }

  /* ── 최근 기록 ── */
  .recent-section {
    padding: 4px 20px 0;
  }
  .recent-title {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
  }

  /* ── 기록 목록 ── */
  .record-list {
    display: flex;
    flex-direction: column;
  }
  .record-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid #F7F7F7;
  }
  .record-item:last-child { border-bottom: none; }
  .record-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }
  .record-label {
    font-size: 14px;
    font-weight: 600;
    color: #111111;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .record-time {
    font-size: 12px;
    color: #BBBBBB;
    letter-spacing: -0.01em;
  }
  .record-amount {
    font-size: 15px;
    font-weight: 700;
    color: #FF2A7A;
    letter-spacing: -0.02em;
    flex-shrink: 0;
    margin-left: 12px;
  }

  /* ── 빈 상태 ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px 24px;
    gap: 8px;
  }
  .empty-icon {
    font-size: 36px;
    margin-bottom: 4px;
  }
  .empty-text {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
  }
  .empty-sub {
    font-size: 13px;
    color: #767676;
    text-align: center;
    line-height: 1.7;
    letter-spacing: -0.01em;
  }
  .empty-sub strong {
    color: #FF2A7A;
    font-weight: 700;
  }

  /* ── FAB ── */
  .fab {
    position: absolute;
    bottom: calc(64px + 34px + 20px);
    right: 20px;
    width: 56px;
    height: 56px;
    background: #FF2A7A;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 4px 20px rgba(255, 42, 122, 0.40),
      0 2px 6px  rgba(255, 42, 122, 0.20);
    text-decoration: none;
    z-index: 20;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .fab:active { transform: scale(0.91); }

  /* ── 하단 네비게이션 (64px) ── */
  .bottom-nav {
    height: 64px;
    display: flex;
    align-items: center;
    background: #FFFFFF;
    border-top: 1px solid #F1F1F5;
    flex-shrink: 0;
    padding: 0 40px;
  }
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Pretendard', sans-serif;
    font-size: 10px;
    font-weight: 600;
    color: #CCCCCC;
    letter-spacing: -0.01em;
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
    padding: 0;
  }
  .nav-item--active { color: #FF2A7A; }
  .nav-item--active svg { stroke: #FF2A7A; }
  .nav-item:not(.nav-item--active) svg { stroke: #CCCCCC; }
  a.nav-item { text-decoration: none; }

  /* ── 홈 인디케이터 (34px) ── */
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
  }
`;
