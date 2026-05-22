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

// ─── 돼지 SVG (상태별 + 인터랙션) ──────────────────────
const PIGGY_MESSAGES: Record<string, string[]> = {
  empty:  ["저도 채워지고 싶어요 🥺", "기록 한 번만요...", "첫 참기 화이팅!", "배고파요..."],
  hungry: ["조금씩 채워지고 있어요 🌱", "잘 참고 있어요!", "파이팅!", "오늘도 최고야!"],
  happy:  ["통통해졌어요 💕", "절약 최고야!", "오늘도 화이팅 ✨", "더 채워줘요!"],
  rich:   ["황금 돼지 등장! 👑", "절약왕 만세 🎉", "부자 됐어요!", "이 맛이지~ 💰"],
};

interface Particle {
  id: number;
  dx: number;
  dy: number;
  emoji: string;
  rotation: number;
}

function PiggyIllustration({ mood }: { mood: string }) {
  const [squish, setSquish]     = useState(false);
  const [shake, setShake]       = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [bubble, setBubble]     = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  const fills = {
    empty:  { body: "#E5E5EC", cheek: "#D0D0D8", eye: "#999999", bg: "#F7F7F7" },
    hungry: { body: "#F5C8D4", cheek: "#EBA8BB", eye: "#111111", bg: "#FFF5F8" },
    happy:  { body: "#FFB6CC", cheek: "#FF8FAF", eye: "#111111", bg: "#FFF0F5" },
    rich:   { body: "#FFD700", cheek: "#FFC000", eye: "#111111", bg: "#FFFBE6" },
  }[mood] ?? { body: "#E5E5EC", cheek: "#D0D0D8", eye: "#999999", bg: "#F7F7F7" };

  const isRich  = mood === "rich";
  const isHappy = mood === "happy" || mood === "rich";
  const isEmpty = mood === "empty";

  // 자동 눈깜빡임
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      tid = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => { setBlinking(false); scheduleBlink(); }, 160);
      }, 2200 + Math.random() * 3500);
    };
    scheduleBlink();
    return () => clearTimeout(tid);
  }, []);

  const handleClick = () => {
    const msgs = PIGGY_MESSAGES[mood] ?? PIGGY_MESSAGES.hungry;
    setBubble(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setBubble(null), 1800);

    if (isEmpty) {
      setShake(true);
      setTimeout(() => setShake(false), 550);
      return;
    }

    setSquish(true);
    setTimeout(() => setSquish(false), 380);

    const emojis = isRich
      ? ["💰", "⭐", "✨", "👑", "💎", "🌟"]
      : mood === "happy"
        ? ["💕", "✨", "🪙", "🌟", "💖", "🎀"]
        : ["🌱", "🪙", "✨", "💪", "🌟", "💚"];

    const next: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      dx: (Math.random() - 0.5) * 160,
      dy: -(Math.random() * 90 + 40),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      rotation: (Math.random() - 0.5) * 360,
    }));
    setParticles(c => [...c, ...next]);
    setTimeout(() => setParticles(c => c.filter(p => !next.some(n => n.id === p.id))), 900);
  };

  const eyeRy = blinking ? 0.8 : (isEmpty ? 4 : 5);
  const eyeRx = isEmpty ? 4 : 5;

  const wrapClass = [
    "piggy-wrap",
    squish  ? "piggy-squish" : "",
    shake   ? "piggy-shake"  : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="piggy-outer" style={{ position: "relative" }}>
      {/* 말풍선 */}
      {bubble && (
        <div className="piggy-bubble" key={bubble + Date.now()}>
          {bubble}
        </div>
      )}

      {/* 파티클 */}
      {particles.map(p => (
        <span
          key={p.id}
          className="piggy-particle"
          style={{
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--rot": `${p.rotation}deg`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}

      <div
        className={wrapClass}
        style={{ background: fills.bg, cursor: "pointer" }}
        aria-label="돼지저금통 캐릭터 — 탭해보세요!"
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => e.key === "Enter" && handleClick()}
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

          {/* 눈 (깜빡임 지원 — ellipse로 변경) */}
          <ellipse cx="56" cy="80" rx={eyeRx} ry={eyeRy} fill={fills.eye}
            style={{ transition: "ry 0.06s ease" }} />
          <ellipse cx="86" cy="80" rx={eyeRx} ry={eyeRy} fill={fills.eye}
            style={{ transition: "ry 0.06s ease" }} />
          {!isEmpty && !blinking && (
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
      </div>
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

        {/* ── 상태바 여백 (UI 없이 여백만) ── */}
        <div className="status-bar" />

        {/* ── GNB 헤더 ── */}
        <header className="gnb">
          <span className="gnb-logo">참으면돼지</span>
          <div className="gnb-right">
            <button className="gnb-icon-btn" aria-label="알림">
              <span className="notif-dot" />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <Link href="/profile" className="gnb-icon-btn" aria-label="프로필">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </Link>
          </div>
        </header>

        {/* ── 스크롤 콘텐츠 ── */}
        <main className="content">

          {/* 전체 누적 금액 + 돼지 */}
          <section className="total-section">
            <p className="total-label">전체 누적 금액</p>
            <p className="total-amount">
              {totalSaved === 0
                ? <><span className="total-num">0</span><span className="total-unit">원</span></>
                : <><span className="total-num">{totalSaved.toLocaleString()}</span><span className="total-unit">원</span></>
              }
            </p>
            <p className="total-sub">{totalSaved === 0 ? "오늘 첫 참기에 도전해보세요!" : "오늘도 부자 한걸음"}</p>
          </section>

          {/* 돼지 */}
          <section className="piggy-section">
            <PiggyIllustration mood={piggy.mood} />
          </section>

          {/* 오늘 참은 금액 카드 */}
          <section className="today-card">
            <p className="today-label">오늘 참은 금액</p>
            <p className="today-amount">
              <span className="today-num">
                {todaySaved === 0 ? <span className="today-zero">0</span> : todaySaved.toLocaleString()}
              </span>
              <span className="today-unit">원</span>
            </p>
          </section>

          {/* 최근 기록 */}
          <section className="recent-section">
            <h2 className="recent-title">최근 기록</h2>
            {recentRecords.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">아직 기록이 없어요</p>
                <p className="empty-sub">아래 + 버튼을 눌러 첫 번째 참기를 기록해보세요</p>
              </div>
            ) : (
              <div className="record-list">
                {recentRecords.map(r => (
                  <div key={r.id} className="record-card">
                    <p className="record-row">
                      <span className="record-label">{r.situation ?? (r.memo || "절약 기록")}</span>
                      <span className="record-dot"> · </span>
                      <span className="record-time">{formatTime(r.createdAt)}</span>
                    </p>
                    <p className="record-amount">+{r.amount.toLocaleString()}원</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div style={{ height: 110 }} />
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

          <Link href="/friends" className="nav-item" aria-label="그룹">
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

  /* ── 상태바 여백 (44px, UI 없음) ── */
  .status-bar {
    height: 44px;
    flex-shrink: 0;
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

  /* ── 전체 누적 금액 섹션 ── */
  .total-section {
    padding: 24px 20px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .total-label {
    font-size: 13px;
    font-weight: 500;
    color: #767676;
    letter-spacing: -0.01em;
    margin-bottom: 10px;
  }
  .total-amount {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 8px;
  }
  .total-num {
    font-size: 48px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.05em;
    line-height: 1;
  }
  .total-unit {
    font-size: 26px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
  }
  .total-sub {
    font-size: 13px;
    color: #AAAAAA;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }

  /* ── 돼지 섹션 ── */
  .piggy-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 24px 20px;
  }
  .piggy-outer {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
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
    animation: piggy-float 3s ease-in-out infinite;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
  }
  .piggy-wrap:focus-visible {
    box-shadow: 0 0 0 3px rgba(255, 42, 122, 0.35);
  }
  .piggy-wrap:active {
    transform: scale(0.93);
  }

  /* ── 돼지 인터랙션 애니메이션 ── */
  @keyframes piggy-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes piggy-squish-anim {
    0%   { transform: scale(1, 1); }
    20%  { transform: scale(1.15, 0.82) translateY(6px); }
    50%  { transform: scale(0.88, 1.18) translateY(-6px); }
    70%  { transform: scale(1.06, 0.95); }
    100% { transform: scale(1, 1); }
  }
  @keyframes piggy-shake-anim {
    0%, 100% { transform: translateX(0); }
    15%      { transform: translateX(-8px) rotate(-3deg); }
    35%      { transform: translateX(7px) rotate(3deg); }
    55%      { transform: translateX(-5px) rotate(-2deg); }
    75%      { transform: translateX(4px) rotate(1deg); }
  }
  .piggy-squish {
    animation: piggy-squish-anim 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
  }
  .piggy-shake {
    animation: piggy-shake-anim 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both !important;
  }

  /* ── 말풍선 ── */
  @keyframes bubble-pop {
    0%   { opacity: 0; transform: translateX(-50%) scale(0.7) translateY(4px); }
    15%  { opacity: 1; transform: translateX(-50%) scale(1.05) translateY(-2px); }
    25%  { transform: translateX(-50%) scale(1) translateY(0); }
    75%  { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(-6px); }
  }
  .piggy-bubble {
    position: absolute;
    top: -52px;
    left: 50%;
    transform: translateX(-50%);
    background: #FFFFFF;
    border: 1.5px solid #F1C0D0;
    border-radius: 16px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    color: #FF2A7A;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(255, 42, 122, 0.15);
    animation: bubble-pop 1.8s ease forwards;
    pointer-events: none;
    z-index: 10;
    letter-spacing: -0.01em;
  }
  .piggy-bubble::after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 8px solid #FFFFFF;
    filter: drop-shadow(0 2px 1px rgba(255, 42, 122, 0.12));
  }
  .piggy-bubble::before {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 9px solid #F1C0D0;
  }

  /* ── 파티클 ── */
  @keyframes particle-fly {
    0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
    60%  { opacity: 0.9; }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.4); }
  }
  .piggy-particle {
    position: absolute;
    top: 50%;
    left: 50%;
    font-size: 18px;
    line-height: 1;
    pointer-events: none;
    animation: particle-fly 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    z-index: 20;
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
    padding: 18px 20px;
    background: #FAFAFA;
    border-radius: 16px;
  }
  .today-label {
    font-size: 13px;
    font-weight: 500;
    color: #767676;
    letter-spacing: -0.01em;
    margin-bottom: 6px;
  }
  .today-amount {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .today-num {
    font-size: 32px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.04em;
    line-height: 1;
  }
  .today-zero { color: #CCCCCC; }
  .today-unit {
    font-size: 16px;
    font-weight: 600;
    color: #767676;
  }

  /* ── 최근 기록 ── */
  .recent-section {
    padding: 0 20px 0;
  }
  .recent-title {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.03em;
    margin-bottom: 12px;
  }

  /* ── 기록 목록 ── */
  .record-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .record-card {
    background: #FFFFFF;
    border: 0.7px solid #E5E5EC;
    border-radius: 12px;
    padding: 16px 17px;
  }
  .record-row {
    font-size: 13px;
    color: #767676;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 0;
  }
  .record-label {
    font-size: 13px;
    font-weight: 600;
    color: #111111;
  }
  .record-dot {
    color: #BBBBBB;
    font-size: 13px;
  }
  .record-time {
    font-size: 13px;
    color: #AAAAAA;
  }
  .record-amount {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
  }

  /* ── 빈 상태 ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px 24px;
    gap: 6px;
  }
  .empty-text {
    font-size: 14px;
    font-weight: 600;
    color: #BBBBBB;
    letter-spacing: -0.02em;
  }
  .empty-sub {
    font-size: 12px;
    color: #CCCCCC;
    text-align: center;
    line-height: 1.6;
    letter-spacing: -0.01em;
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
