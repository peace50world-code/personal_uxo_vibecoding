"use client";

import { useState } from "react";
import Link from "next/link";

// ─── 상황 태그 ────────────────────────────────────────
const SITUATIONS = ["차액 아끼기", "배달 참기", "커피 참기", "쇼핑 참기", "택시 참기", "간식 참기"];

type SaveState = "idle" | "saving" | "done";

export default function RecordPage() {
  const [amount,    setAmount]    = useState(0);
  const [situation, setSituation] = useState<string | null>(null);
  const [memo,      setMemo]      = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const addAmount = (delta: number) => {
    setAmount(prev => Math.max(0, prev + delta));
  };
  const clearAmount = () => setAmount(0);

  const handleSave = () => {
    if (amount <= 0) return;
    setSaveState("saving");
    setTimeout(() => setSaveState("done"), 900);
  };

  const canSave = amount > 0 && saveState === "idle";

  /* ── 저장 완료 화면 ── */
  if (saveState === "done") {
    return (
      <>
        <style>{css}</style>
        <div className="shell">
          <div className="done-screen">
            <div className="done-pig">🐷</div>
            <div className="done-badge">🎉 절약 성공!</div>
            <h1 className="done-title">잘 참았어요!</h1>
            <p className="done-sub">
              <span className="done-amount">{amount.toLocaleString()}원</span>을 아꼈어요
              {situation && <><br /><span className="done-situation">{situation}</span></>}
            </p>
            <Link href="/" className="btn-home">홈으로 돌아가기</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* ─── 상태바 ─── */}
        <div className="status-bar">
          <span className="status-time">9:41</span>
          <div className="status-icons">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0"  y="4" width="3" height="8" rx="1" fill="#111"/>
              <rect x="4"  y="2" width="3" height="10" rx="1" fill="#111"/>
              <rect x="8"  y="0" width="3" height="12" rx="1" fill="#111"/>
              <rect x="12" y="0" width="3" height="12" rx="1" fill="#111" opacity="0.3"/>
            </svg>
            <svg width="16" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#111" strokeOpacity="0.35"/>
              <rect x="2"   y="2"   width="16" height="8"  rx="2"   fill="#111"/>
              <path d="M23 4.5v3c.826-.413 1.5-1.5 1.5-1.5S23.826 4.913 23 4.5z" fill="#111" opacity="0.4"/>
            </svg>
          </div>
        </div>

        {/* ─── 닫기 버튼 행 ─── */}
        <div className="close-row">
          <Link href="/" className="close-btn" aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6"  y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </Link>
        </div>

        {/* ─── 스크롤 바디 ─── */}
        <div className="scroll-body">

          {/* 참은 금액 입력 */}
          <section className="amount-section">
            <p className="amount-label">참은 금액</p>
            <div className="amount-display">
              <span className={`amount-number ${amount > 0 ? "amount-number--active" : ""}`}>
                {amount.toLocaleString()}
              </span>
              <span className="amount-unit">원</span>
            </div>
          </section>

          {/* 빠른 버튼 행 1: +1,000 / +5,000 / +10,000 */}
          <div className="btn-row">
            {[1000, 5000, 10000].map(v => (
              <button key={v} className="quick-add-btn" onClick={() => addAmount(v)}>
                +{v.toLocaleString()}
              </button>
            ))}
          </div>

          {/* 빠른 버튼 행 2: -1,000 / C */}
          <div className="btn-row btn-row--secondary">
            <button className="quick-sub-btn" onClick={() => addAmount(-1000)}>
              -1,000
            </button>
            <button className="quick-clear-btn" onClick={clearAmount}>
              C
            </button>
          </div>

          {/* 상황 선택 */}
          <section className="situation-section">
            <p className="section-label">상황 선택</p>
            <div className="chips-grid">
              {SITUATIONS.map(s => (
                <button
                  key={s}
                  className={`chip ${situation === s ? "chip--active" : ""}`}
                  onClick={() => setSituation(prev => prev === s ? null : s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* 직접 입력 */}
          <div className="memo-wrap">
            <input
              className="memo-input"
              type="text"
              placeholder="또는 직접 입력하세요"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              maxLength={40}
            />
          </div>

        </div>

        {/* ─── 저장 버튼 영역 ─── */}
        <div className="bottom-area">
          <button
            className={`btn-save ${!canSave ? "btn-save--disabled" : ""} ${saveState === "saving" ? "btn-save--loading" : ""}`}
            onClick={handleSave}
            disabled={!canSave}
          >
            {saveState === "saving" ? <span className="spinner" /> : "저장하기"}
          </button>
          <div className="home-indicator" />
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
    position: relative;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
  }

  /* ── 상태바 ── */
  .status-bar {
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background: #FFFFFF;
  }
  .status-time {
    font-size: 15px;
    font-weight: 600;
    color: #111111;
    letter-spacing: -0.01em;
  }
  .status-icons {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── 닫기 버튼 행 ── */
  .close-row {
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 20px;
  }
  .close-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F1F5;
    border-radius: 50%;
    color: #111111;
    text-decoration: none;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .close-btn:active { background: #E5E5EC; }

  /* ── 스크롤 바디 ── */
  .scroll-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 24px;
    scrollbar-width: none;
  }
  .scroll-body::-webkit-scrollbar { display: none; }

  /* ── 금액 섹션 ── */
  .amount-section {
    padding-top: 24px;
    padding-bottom: 32px;
  }
  .amount-label {
    font-size: 15px;
    font-weight: 600;
    color: #767676;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
  }
  .amount-display {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 20px 20px;
    background: #F7F7F7;
    border-radius: 20px;
    min-height: 78px;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }
  .amount-display:has(.amount-number--active) {
    border-color: #FF2A7A;
    background: #FFF8FB;
  }
  .amount-number {
    font-size: 40px;
    font-weight: 800;
    color: #D0D0D8;
    letter-spacing: -0.04em;
    line-height: 1;
    transition: color 0.2s;
  }
  .amount-number--active {
    color: #111111;
  }
  .amount-unit {
    font-size: 22px;
    font-weight: 700;
    color: #767676;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  /* ── 빠른 버튼 행 ── */
  .btn-row {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }
  .btn-row--secondary {
    margin-bottom: 32px;
  }

  .quick-add-btn {
    flex: 1;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111111;
    color: #FFFFFF;
    font-family: 'Pretendard', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .quick-add-btn:active {
    background: #333333;
    transform: scale(0.96);
  }

  .quick-sub-btn {
    flex: 1;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F1F5;
    color: #111111;
    font-family: 'Pretendard', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.02em;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .quick-sub-btn:active { background: #E5E5EC; transform: scale(0.96); }

  .quick-clear-btn {
    width: 80px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFE8F2;
    color: #FF2A7A;
    font-family: 'Pretendard', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.01em;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .quick-clear-btn:active { background: #FFD4E9; transform: scale(0.96); }

  /* ── 상황 선택 ── */
  .situation-section {
    margin-bottom: 20px;
  }
  .section-label {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
    margin-bottom: 14px;
  }
  .chips-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .chip {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F7F7F7;
    border: 2px solid transparent;
    border-radius: 100px;
    font-family: 'Pretendard', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #767676;
    letter-spacing: -0.01em;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
  }
  .chip:active { transform: scale(0.96); }
  .chip--active {
    background: #FFE8F2;
    border-color: #FF2A7A;
    color: #FF2A7A;
  }

  /* ── 직접 입력 ── */
  .memo-wrap {
    border-radius: 14px;
    overflow: hidden;
    border: 1.5px solid #E5E5EC;
    transition: border-color 0.2s;
  }
  .memo-wrap:focus-within {
    border-color: #FF2A7A;
    box-shadow: 0 0 0 3px rgba(255, 42, 122, 0.10);
  }
  .memo-input {
    width: 100%;
    height: 52px;
    padding: 0 16px;
    background: #FAFAFA;
    border: none;
    outline: none;
    font-family: 'Pretendard', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #111111;
    letter-spacing: -0.01em;
  }
  .memo-input::placeholder {
    color: #BBBBBB;
  }

  /* ── 저장 버튼 영역 ── */
  .bottom-area {
    flex-shrink: 0;
    padding: 12px 20px 0;
    background: #FFFFFF;
    border-top: 1px solid #F1F1F5;
  }
  .btn-save {
    width: 100%;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FF2A7A;
    color: #FFFFFF;
    font-family: 'Pretendard', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.01em;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(255, 42, 122, 0.30);
    transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-save:not(:disabled):active {
    transform: scale(0.97);
    box-shadow: 0 3px 10px rgba(255, 42, 122, 0.20);
  }
  .btn-save--disabled {
    background: #F1F1F5;
    color: #BBBBBB;
    box-shadow: none;
    cursor: not-allowed;
  }
  .btn-save--loading { pointer-events: none; }

  /* ── 홈 인디케이터 ── */
  .home-indicator {
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .home-indicator::after {
    content: '';
    width: 134px;
    height: 5px;
    background: #111111;
    border-radius: 100px;
    opacity: 0.18;
  }

  /* ── 스피너 ── */
  .spinner {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2.5px solid rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
    animation: spin 0.7s linear infinite;
  }

  /* ── 완료 화면 ── */
  .done-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 28px 80px;
  }
  .done-pig {
    font-size: 80px;
    line-height: 1;
    margin-bottom: 24px;
    animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .done-badge {
    font-size: 13px;
    font-weight: 700;
    background: #FF2A7A;
    color: white;
    padding: 5px 16px;
    border-radius: 100px;
    margin-bottom: 16px;
    box-shadow: 0 4px 14px rgba(255, 42, 122, 0.30);
    animation: fadeUp 0.4s 0.2s ease both;
  }
  .done-title {
    font-size: 26px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.04em;
    margin-bottom: 12px;
    animation: fadeUp 0.4s 0.3s ease both;
  }
  .done-sub {
    font-size: 15px;
    color: #767676;
    text-align: center;
    line-height: 1.7;
    margin-bottom: 40px;
    animation: fadeUp 0.4s 0.35s ease both;
  }
  .done-amount {
    font-size: 20px;
    font-weight: 700;
    color: #FF2A7A;
  }
  .done-situation {
    font-weight: 600;
    color: #111111;
  }
  .btn-home {
    width: 100%;
    max-width: 320px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FF2A7A;
    color: #fff;
    font-family: 'Pretendard', sans-serif;
    font-size: 16px;
    font-weight: 700;
    text-decoration: none;
    border-radius: 16px;
    box-shadow: 0 6px 20px rgba(255, 42, 122, 0.30);
    transition: all 0.2s;
    animation: fadeUp 0.4s 0.45s ease both;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-home:active {
    transform: scale(0.97);
    box-shadow: 0 3px 10px rgba(255, 42, 122, 0.20);
  }

  /* ── 키프레임 ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
`;
