"use client";

import { useState } from "react";
import Link from "next/link";

// ─── 카테고리 ───────────────────────────────────────
type CategoryKey = "배달" | "카페" | "쇼핑" | "덕질";

const CATEGORIES: { key: CategoryKey; emoji: string; color: string; bg: string }[] = [
  { key: "배달", emoji: "🛵", color: "#FF5500", bg: "#FFF0E8" },
  { key: "카페", emoji: "☕", color: "#6B4226", bg: "#FFF5EE" },
  { key: "쇼핑", emoji: "🛍️", color: "#0055CC", bg: "#EBF2FF" },
  { key: "덕질", emoji: "⭐", color: "#9B18A2", bg: "#F9F0FF" },
];

// ─── 빠른 입력 아이템 ───────────────────────────────
const QUICK_ITEMS = [
  { id: 1, category: "카페" as CategoryKey, label: "아이스 아메리카노", amount: 4500 },
  { id: 2, category: "배달" as CategoryKey, label: "치킨 세트", amount: 18000 },
  { id: 3, category: "쇼핑" as CategoryKey, label: "충동구매 아이템", amount: 0 },
];

type SaveState = "idle" | "saving" | "done";

export default function RecordPage() {
  const [category, setCategory]   = useState<CategoryKey | null>(null);
  const [item,     setItem]       = useState("");
  const [amount,   setAmount]     = useState("");
  const [quickId,  setQuickId]    = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const handleQuickSelect = (q: typeof QUICK_ITEMS[0]) => {
    setQuickId(q.id);
    setCategory(q.category);
    setItem(q.label);
    if (q.amount > 0) setAmount(String(q.amount));
  };

  const handleSave = () => {
    if (!item.trim() || !amount || !category) return;
    setSaveState("saving");
    setTimeout(() => setSaveState("done"), 900);
  };

  const canSave = !!category && item.trim().length > 0 && amount.length > 0 && saveState === "idle";

  /* ── 저장 완료 화면 ── */
  if (saveState === "done") {
    const cat = CATEGORIES.find(c => c.key === category)!;
    return (
      <>
        <style>{css}</style>
        <div className="shell">
          <div className="done-screen">
            {/* 성공 아이콘 */}
            <div className="done-circle" style={{ background: cat.bg }}>
              <span style={{ fontSize: 52 }}>{cat.emoji}</span>
            </div>

            <div className="done-badge">🎉 절약 성공!</div>
            <h1 className="done-title">잘 참았어요!</h1>
            <p className="done-sub">
              <span className="done-item-name">{item}</span>을(를) 참아서
              <br />
              <span className="done-amount">{Number(amount).toLocaleString()}원</span>을 아꼈어요
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

        {/* ─── 헤더 ─── */}
        <header className="page-header">
          <Link href="/" className="back-btn" aria-label="뒤로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </Link>
          <h1 className="page-title">참은 소비 기록하기</h1>
        </header>

        {/* ─── 스크롤 바디 ─── */}
        <div className="scroll-body">

          {/* 카테고리 선택 */}
          <section className="form-section">
            <label className="form-label">카테고리</label>
            <div className="cat-grid">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  className={`cat-card ${category === c.key ? "cat-card--active" : ""}`}
                  onClick={() => { setCategory(c.key); setQuickId(null); }}
                  style={category === c.key
                    ? { borderColor: c.color, backgroundColor: c.bg }
                    : {}
                  }
                >
                  <span className="cat-card-emoji">{c.emoji}</span>
                  <span className="cat-card-label"
                    style={{ color: category === c.key ? c.color : "#111111" }}>
                    {c.key}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 빠른 입력 */}
          <section className="form-section">
            <div className="label-row">
              <label className="form-label">원터치 자동입력</label>
              <span className="label-hint">탭하면 자동으로 채워져요</span>
            </div>
            <div className="quick-list">
              {QUICK_ITEMS.map((q) => (
                <button
                  key={q.id}
                  className={`quick-item ${quickId === q.id ? "quick-item--active" : ""}`}
                  onClick={() => handleQuickSelect(q)}
                >
                  <span className="quick-item-emoji">
                    {CATEGORIES.find(c => c.key === q.category)?.emoji}
                  </span>
                  <div className="quick-item-info">
                    <span className="quick-item-label">{q.label}</span>
                    {q.amount > 0 && (
                      <span className="quick-item-amount">{q.amount.toLocaleString()}원</span>
                    )}
                  </div>
                  {quickId === q.id && (
                    <span className="quick-check">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 무엇을 참았나요 */}
          <section className="form-section">
            <label className="form-label" htmlFor="item-input">무엇을 참았나요?</label>
            <div className={`input-wrap ${item ? "input-wrap--filled" : ""}`}>
              <input
                id="item-input"
                className="text-input"
                type="text"
                placeholder="아이스 아메리카노, 신발, 콘서트 티켓…"
                value={item}
                onChange={(e) => { setItem(e.target.value); setQuickId(null); }}
              />
              {item && (
                <button className="input-clear" onClick={() => { setItem(""); setQuickId(null); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </section>

          {/* 얼마를 아꼈나요 */}
          <section className="form-section">
            <label className="form-label" htmlFor="amount-input">얼마를 아꼈나요?</label>
            <div className={`input-wrap ${amount ? "input-wrap--filled" : ""}`}>
              <input
                id="amount-input"
                className="text-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setQuickId(null); }}
              />
              <span className="input-suffix">원</span>
            </div>
            {amount && Number(amount) > 0 && (
              <p className="amount-preview">
                {Number(amount).toLocaleString()}원을 아꼈어요 🐷
              </p>
            )}
          </section>

        </div>

        {/* ─── 저장 버튼 ─── */}
        <div className="bottom-area">
          <button
            className={`btn-save ${!canSave ? "btn-save--disabled" : ""} ${saveState === "saving" ? "btn-save--loading" : ""}`}
            onClick={handleSave}
            disabled={!canSave}
          >
            {saveState === "saving"
              ? <span className="spinner" />
              : "저장하기"
            }
          </button>
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
    max-width: 390px;
    min-height: 100svh;
    margin: 0 auto;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    position: relative;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* ── 헤더 ── */
  .page-header {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: #FFFFFF;
    border-bottom: 1px solid #F1F1F5;
  }
  .back-btn {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F1F5;
    border: none;
    border-radius: 50%;
    color: #111111;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }
  .back-btn:active { background: #E5E5EC; }
  .page-title {
    font-size: 17px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.025em;
  }

  /* ── 스크롤 바디 ── */
  .scroll-body {
    flex: 1;
    overflow-y: auto;
    padding: 4px 20px 140px;
    scrollbar-width: none;
  }
  .scroll-body::-webkit-scrollbar { display: none; }

  /* ── 폼 섹션 ── */
  .form-section {
    margin-top: 28px;
  }
  .form-label {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
  }
  .label-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
  }
  .label-hint {
    font-size: 12px;
    color: #999999;
  }

  /* ── 카테고리 그리드 ── */
  .cat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .cat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 8px 12px;
    background: #F7F7F7;
    border: 2px solid transparent;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .cat-card:active { transform: scale(0.94); }
  .cat-card--active {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  .cat-card-emoji { font-size: 24px; line-height: 1; }
  .cat-card-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  /* ── 빠른 입력 목록 ── */
  .quick-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .quick-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: #F7F7F7;
    border: 2px solid transparent;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .quick-item:active { opacity: 0.8; }
  .quick-item--active {
    border-color: #FF2A7A;
    background: #FFF0F8;
  }
  .quick-item-emoji { font-size: 22px; line-height: 1; flex-shrink: 0; }
  .quick-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
    text-align: left;
  }
  .quick-item-label {
    font-size: 14px;
    font-weight: 500;
    color: #111111;
    letter-spacing: -0.01em;
  }
  .quick-item-amount {
    font-size: 13px;
    font-weight: 700;
    color: #FF2A7A;
  }
  .quick-check {
    width: 22px;
    height: 22px;
    background: #FF2A7A;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* ── 인풋 ── */
  .input-wrap {
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 16px;
    background: #F7F7F7;
    border: 1.5px solid transparent;
    border-radius: 14px;
    transition: border-color 0.2s, background 0.2s;
  }
  .input-wrap:focus-within {
    background: #FFFFFF;
    border-color: #FF2A7A;
    box-shadow: 0 0 0 3px rgba(255, 42, 122, 0.10);
  }
  .input-wrap--filled {
    background: #FFFFFF;
    border-color: #E5E5EC;
  }
  .text-input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Pretendard', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #111111;
    -moz-appearance: textfield;
    letter-spacing: -0.01em;
  }
  .text-input::-webkit-inner-spin-button,
  .text-input::-webkit-outer-spin-button { -webkit-appearance: none; }
  .text-input::placeholder {
    color: #BBBBBB;
    font-weight: 400;
  }
  .input-clear {
    background: none;
    border: none;
    cursor: pointer;
    color: #BBBBBB;
    display: flex;
    align-items: center;
    padding: 4px;
    -webkit-tap-highlight-color: transparent;
  }
  .input-clear:hover { color: #767676; }
  .input-suffix {
    font-size: 15px;
    font-weight: 600;
    color: #767676;
    flex-shrink: 0;
    margin-left: 4px;
  }
  .amount-preview {
    margin-top: 8px;
    padding-left: 4px;
    font-size: 13px;
    font-weight: 600;
    color: #FF2A7A;
    animation: fadeUp 0.2s ease;
  }

  /* ── 저장 버튼 영역 ── */
  .bottom-area {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 390px;
    padding: 12px 20px max(20px, env(safe-area-inset-bottom));
    background: linear-gradient(to bottom, transparent, #fff 28%);
    z-index: 30;
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
    box-shadow: 0 6px 20px rgba(255, 42, 122, 0.35);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .btn-save:not(:disabled):active {
    transform: scale(0.97);
    box-shadow: 0 3px 10px rgba(255, 42, 122, 0.25);
  }
  .btn-save--disabled {
    background: #F1F1F5;
    color: #BBBBBB;
    box-shadow: none;
    cursor: not-allowed;
  }
  .btn-save--loading { pointer-events: none; }

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
    gap: 0;
  }
  .done-circle {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
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
  .done-item-name { font-weight: 700; color: #111111; }
  .done-amount {
    font-size: 20px;
    font-weight: 700;
    color: #FF2A7A;
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
    box-shadow: 0 6px 20px rgba(255, 42, 122, 0.35);
    transition: all 0.2s;
    animation: fadeUp 0.4s 0.45s ease both;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-home:active {
    transform: scale(0.97);
    box-shadow: 0 3px 10px rgba(255, 42, 122, 0.25);
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
