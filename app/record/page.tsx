"use client";

import { useState } from "react";

const QUICK_ITEMS = [
  { id: 1, emoji: "☕", label: "커피",    amount: 4000  },
  { id: 2, emoji: "🧃", label: "음료수",  amount: 2000  },
  { id: 3, emoji: "🛵", label: "배달음식", amount: 15000 },
];

type SaveState = "idle" | "saving" | "done";

export default function RecordPage() {
  const [selected, setSelected]   = useState<number | null>(null);
  const [item,     setItem]       = useState("");
  const [amount,   setAmount]     = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const handleQuickSelect = (q: typeof QUICK_ITEMS[0]) => {
    setSelected(q.id);
    setItem(q.label);
    setAmount(String(q.amount));
  };

  const handleSave = () => {
    if (!item.trim() || !amount) return;
    setSaveState("saving");
    setTimeout(() => setSaveState("done"), 900);
  };

  const canSave = item.trim().length > 0 && amount.length > 0 && saveState === "idle";

  /* ── DONE SCREEN ── */
  if (saveState === "done") {
    return (
      <>
        <style>{sharedStyles + doneStyles}</style>
        <div className="shell">
          <div className="bg-blob blob-1" /><div className="bg-blob blob-2" /><div className="grain" />
          <div className="done-screen">
            <div className="done-pig">
              <svg width="110" height="110" viewBox="0 0 136 136" fill="none">
                <ellipse cx="26" cy="40" rx="18" ry="20" fill="#FFB0C5"/>
                <ellipse cx="26" cy="41" rx="11" ry="13" fill="#FF8FAB"/>
                <ellipse cx="110" cy="40" rx="18" ry="20" fill="#FFB0C5"/>
                <ellipse cx="110" cy="41" rx="11" ry="13" fill="#FF8FAB"/>
                <ellipse cx="68" cy="78" rx="50" ry="48" fill="#FFD6E3"/>
                <ellipse cx="52" cy="55" rx="14" ry="8" fill="rgba(255,255,255,0.40)" style={{filter:"blur(4px)"}}/>
                <ellipse cx="50" cy="66" rx="7" ry="8" fill="#3D2030"/>
                <ellipse cx="86" cy="66" rx="7" ry="8" fill="#3D2030"/>
                <circle cx="52.5" cy="63" r="2.5" fill="white"/>
                <circle cx="88.5" cy="63" r="2.5" fill="white"/>
                <ellipse cx="36" cy="80" rx="12" ry="8" fill="#FFB6C8" opacity="0.6"/>
                <ellipse cx="100" cy="80" rx="12" ry="8" fill="#FFB6C8" opacity="0.6"/>
                <ellipse cx="68" cy="92" rx="20" ry="15" fill="#FFB0C5"/>
                <ellipse cx="61" cy="93" rx="5.5" ry="4.5" fill="rgba(180,60,90,0.30)"/>
                <ellipse cx="75" cy="93" rx="5.5" ry="4.5" fill="rgba(180,60,90,0.30)"/>
                {/* Happy eyes — curved lines */}
                <path d="M44 62 Q50 56 56 62" stroke="#3D2030" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M80 62 Q86 56 92 62" stroke="#3D2030" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M52 108 Q68 122 84 108" stroke="#D94F6B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
              </svg>
            </div>
            <div className="done-badge">🎉 절약 성공!</div>
            <p className="done-title">잘 참았어요!</p>
            <p className="done-sub">
              <span className="done-item">{item}</span>을(를) 참아서<br/>
              <span className="done-amount">{Number(amount).toLocaleString()}원</span>을 저금했어요
            </p>
            <button
              className="btn-home"
              onClick={() => { setSaveState("idle"); setSelected(null); setItem(""); setAmount(""); }}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{sharedStyles + pageStyles}</style>
      <div className="shell">
        <div className="bg-blob blob-1" /><div className="bg-blob blob-2" /><div className="grain" />

        {/* ── HEADER ── */}
        <header className="page-header">
          <button className="back-btn" aria-label="뒤로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </button>
          <h1 className="page-title">참은 소비 기록하기</h1>
        </header>

        {/* ── SCROLLABLE BODY ── */}
        <div className="scroll-body">

          {/* QUICK INPUT */}
          <section className="section">
            <div className="section-label-row">
              <span className="section-label">원터치 자동입력</span>
              <span className="section-hint">탭하면 자동으로 채워져요</span>
            </div>

            <div className="quick-grid">
              {QUICK_ITEMS.map((q) => (
                <button
                  key={q.id}
                  className={`quick-card ${selected === q.id ? "quick-card--active" : ""}`}
                  onClick={() => handleQuickSelect(q)}
                >
                  {/* check badge */}
                  {selected === q.id && (
                    <span className="quick-check">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  <div className={`quick-icon-wrap ${selected === q.id ? "quick-icon-wrap--active" : ""}`}>
                    <span className="quick-emoji">{q.emoji}</span>
                  </div>
                  <span className="quick-label">{q.label}</span>
                  <span className="quick-amount">{q.amount.toLocaleString()}원</span>
                </button>
              ))}
            </div>
          </section>

          {/* WHAT */}
          <section className="section">
            <label className="field-label">무엇을 참았나요?</label>
            <div className={`input-wrap ${item ? "input-wrap--filled" : ""}`}>
              <input
                className="text-input"
                type="text"
                placeholder="아바라 대신 아아"
                value={item}
                onChange={(e) => { setItem(e.target.value); setSelected(null); }}
              />
              {item && (
                <button className="input-clear" onClick={() => { setItem(""); setSelected(null); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </section>

          {/* HOW MUCH */}
          <section className="section">
            <label className="field-label">얼마를 아꼈나요?</label>
            <div className={`input-wrap ${amount ? "input-wrap--filled" : ""}`}>
              <input
                className="text-input"
                type="number"
                inputMode="numeric"
                placeholder="2500"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setSelected(null); }}
              />
              <span className="input-suffix">원</span>
            </div>
            {amount && (
              <p className="amount-preview">
                {Number(amount).toLocaleString()}원을 저금할게요 🐷
              </p>
            )}
          </section>

        </div>

        {/* ── SAVE BUTTON ── */}
        <div className="bottom-area">
          <button
            className={`btn-save ${!canSave ? "btn-save--disabled" : ""} ${saveState === "saving" ? "btn-save--loading" : ""}`}
            onClick={handleSave}
            disabled={!canSave}
          >
            {saveState === "saving" ? (
              <span className="spinner" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                저장하기
              </>
            )}
          </button>
        </div>

      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   SHARED STYLES  (same token set as home page)
───────────────────────────────────────────── */
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Gmarket+Sans:wght@300;500;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --pink-vivid:  #FF6B8B;
    --pink-mid:    #FFB6C8;
    --pink-soft:   #FFD6E3;
    --pink-pale:   #FFF0F5;
    --cream:       #FFFAF8;
    --brown:       #3D2030;
    --brown-light: #8B5A6E;
    --brown-muted: #C4A0AE;
    --white:       #FFFFFF;
  }
  html, body { height: 100%; background: #f0e8ec; }
  .shell {
    width: 100%; max-width: 390px; min-height: 100svh;
    margin: 0 auto;
    background: var(--cream);
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    font-family: 'Noto Sans KR', -apple-system, sans-serif;
  }
  .bg-blob { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
  .blob-1 {
    width: 260px; height: 260px; top: -70px; right: -50px;
    background: radial-gradient(circle, #FFB6C8 0%, transparent 70%);
    opacity: 0.50; filter: blur(44px);
  }
  .blob-2 {
    width: 180px; height: 180px; bottom: 120px; left: -60px;
    background: radial-gradient(circle, #FFC8D8 0%, transparent 70%);
    opacity: 0.32; filter: blur(36px);
  }
  .grain {
    position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px 180px;
  }
`;

/* ─────────────────────────────────────────────
   PAGE-SPECIFIC STYLES
───────────────────────────────────────────── */
const pageStyles = `
  /* HEADER */
  .page-header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; gap: 10px;
    padding: 52px 20px 16px;
    background: linear-gradient(to bottom, var(--cream) 80%, transparent);
  }
  .back-btn {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    background: var(--white); border: 1.5px solid var(--pink-soft);
    border-radius: 12px; color: var(--brown-light);
    box-shadow: 0 2px 8px rgba(255,107,139,0.10);
    cursor: pointer; flex-shrink: 0;
    transition: all .18s ease;
  }
  .back-btn:active { transform: scale(.93); background: var(--pink-pale); }
  .page-title {
    font-family: 'Gmarket Sans', sans-serif;
    font-size: 18px; font-weight: 700;
    color: var(--brown); letter-spacing: -0.02em;
  }

  /* SCROLL BODY */
  .scroll-body {
    flex: 1; overflow-y: auto;
    padding: 8px 20px 140px;
    position: relative; z-index: 2;
    scrollbar-width: none;
  }
  .scroll-body::-webkit-scrollbar { display: none; }

  /* SECTIONS */
  .section { margin-bottom: 32px; }

  .section-label-row {
    display: flex; align-items: baseline; gap: 8px;
    margin-bottom: 14px;
  }
  .section-label {
    font-family: 'Gmarket Sans', sans-serif;
    font-size: 17px; font-weight: 700;
    color: var(--brown); letter-spacing: -0.02em;
  }
  .section-hint {
    font-size: 11px; color: var(--brown-muted); font-weight: 500;
  }

  /* QUICK CARDS */
  .quick-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .quick-card {
    position: relative;
    display: flex; flex-direction: column;
    align-items: center; gap: 8px;
    padding: 18px 12px 16px;
    background: var(--white);
    border: 1.5px solid var(--pink-soft);
    border-radius: 20px;
    cursor: pointer;
    box-shadow: 0 3px 14px rgba(255,107,139,0.08);
    transition: all .22s cubic-bezier(0.34,1.56,0.64,1);
    -webkit-tap-highlight-color: transparent;
  }
  .quick-card:active { transform: scale(.94); }
  .quick-card--active {
    border-color: var(--pink-vivid);
    background: var(--pink-pale);
    box-shadow: 0 6px 20px rgba(255,107,139,0.22);
    transform: translateY(-2px);
  }
  .quick-check {
    position: absolute; top: 8px; right: 8px;
    width: 18px; height: 18px;
    background: var(--pink-vivid);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .quick-icon-wrap {
    width: 54px; height: 54px; border-radius: 16px;
    background: var(--pink-pale);
    display: flex; align-items: center; justify-content: center;
    transition: background .2s;
  }
  .quick-icon-wrap--active { background: rgba(255,107,139,0.15); }
  .quick-emoji { font-size: 26px; line-height: 1; }
  .quick-label {
    font-size: 13px; font-weight: 700; color: var(--brown);
    letter-spacing: -0.01em;
  }
  .quick-amount {
    font-family: 'Gmarket Sans', sans-serif;
    font-size: 12px; font-weight: 700; color: var(--pink-vivid);
  }

  /* FIELD LABEL */
  .field-label {
    display: block;
    font-family: 'Gmarket Sans', sans-serif;
    font-size: 17px; font-weight: 700;
    color: var(--brown); letter-spacing: -0.02em;
    margin-bottom: 12px;
  }

  /* INPUT WRAP */
  .input-wrap {
    position: relative;
    display: flex; align-items: center;
    background: var(--white);
    border: 1.5px solid var(--pink-soft);
    border-radius: 16px;
    padding: 0 16px;
    height: 58px;
    box-shadow: 0 2px 10px rgba(255,107,139,0.06);
    transition: border-color .2s, box-shadow .2s;
  }
  .input-wrap:focus-within {
    border-color: var(--pink-vivid);
    box-shadow: 0 0 0 3px rgba(255,107,139,0.12), 0 2px 10px rgba(255,107,139,0.08);
  }
  .input-wrap--filled { border-color: var(--pink-mid); }

  .text-input {
    flex: 1; height: 100%;
    background: transparent; border: none; outline: none;
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 15px; font-weight: 500;
    color: var(--brown);
    -moz-appearance: textfield;
  }
  .text-input::-webkit-inner-spin-button,
  .text-input::-webkit-outer-spin-button { -webkit-appearance: none; }
  .text-input::placeholder { color: var(--brown-muted); font-weight: 400; }

  .input-clear {
    background: none; border: none; cursor: pointer;
    color: var(--brown-muted); padding: 4px; flex-shrink: 0;
    display: flex; align-items: center;
    transition: color .15s;
  }
  .input-clear:hover { color: var(--brown-light); }

  .input-suffix {
    font-size: 14px; font-weight: 700;
    color: var(--brown-light); flex-shrink: 0;
    margin-left: 4px;
  }

  .amount-preview {
    margin-top: 8px; padding-left: 4px;
    font-size: 12px; font-weight: 600;
    color: var(--pink-vivid);
    animation: fadeUp .25s ease;
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* SAVE BUTTON */
  .bottom-area {
    position: fixed; bottom: 0;
    left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 390px;
    padding: 12px 20px max(20px, env(safe-area-inset-bottom));
    background: linear-gradient(to bottom, transparent, var(--cream) 30%);
    z-index: 30;
  }
  .btn-save {
    width: 100%; height: 58px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: linear-gradient(135deg, #FF7A97 0%, #FF5A80 55%, #F04870 100%);
    color: #fff; font-family: 'Noto Sans KR', sans-serif;
    font-size: 16px; font-weight: 700; letter-spacing: 0.01em;
    border: none; border-radius: 18px; cursor: pointer;
    box-shadow: 0 8px 24px rgba(255,80,115,0.38), 0 2px 8px rgba(255,80,115,0.20),
      inset 0 1px 0 rgba(255,255,255,0.25);
    transition: all .22s cubic-bezier(0.34,1.56,0.64,1);
    position: relative; overflow: hidden;
  }
  .btn-save::after {
    content:''; position:absolute; top:0; left:0; right:0; height:50%;
    background: linear-gradient(to bottom, rgba(255,255,255,0.16), transparent);
    border-radius: 18px 18px 0 0; pointer-events:none;
  }
  .btn-save:not(:disabled):active {
    transform: scale(.97) translateY(1px);
    box-shadow: 0 4px 12px rgba(255,80,115,0.28);
  }
  .btn-save--disabled {
    background: #E8D8DC; color: #C4A0AE;
    box-shadow: none; cursor: not-allowed;
  }
  .btn-save--disabled::after { display: none; }
  .btn-save--loading { pointer-events: none; }

  /* SPINNER */
  .spinner {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─────────────────────────────────────────────
   DONE SCREEN STYLES
───────────────────────────────────────────── */
const doneStyles = `
  .done-screen {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 28px 60px;
    position: relative; z-index: 2;
    gap: 0;
  }
  .done-pig {
    width: 160px; height: 160px;
    border-radius: 50%;
    background: linear-gradient(145deg, #FFD6E3, #FFC0D0, #FFB0C5);
    box-shadow: 0 20px 48px rgba(255,107,139,0.30), inset 0 6px 20px rgba(255,255,255,0.50);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px;
    animation: popIn .5s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes popIn {
    from { opacity:0; transform:scale(.6); }
    to   { opacity:1; transform:scale(1); }
  }
  .done-badge {
    font-size: 13px; font-weight: 700;
    background: linear-gradient(135deg, #FF7A97, #FF5A80);
    color: white; padding: 5px 16px;
    border-radius: 100px;
    margin-bottom: 16px;
    box-shadow: 0 4px 14px rgba(255,80,115,0.30);
    animation: fadeUp .4s .2s ease both;
  }
  .done-title {
    font-family: 'Gmarket Sans', sans-serif;
    font-size: 26px; font-weight: 700;
    color: var(--brown); letter-spacing: -0.03em;
    margin-bottom: 12px;
    animation: fadeUp .4s .3s ease both;
  }
  .done-sub {
    font-size: 15px; color: var(--brown-light); font-weight: 500;
    text-align: center; line-height: 1.7;
    margin-bottom: 36px;
    animation: fadeUp .4s .35s ease both;
  }
  .done-item  { font-weight: 700; color: var(--brown); }
  .done-amount {
    font-family: 'Gmarket Sans', sans-serif;
    font-size: 20px; font-weight: 700; color: var(--pink-vivid);
  }
  .btn-home {
    width: 100%; height: 56px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #FF7A97, #FF5A80, #F04870);
    color: #fff; font-family: 'Noto Sans KR', sans-serif;
    font-size: 16px; font-weight: 700;
    border: none; border-radius: 18px; cursor: pointer;
    box-shadow: 0 8px 24px rgba(255,80,115,0.38);
    transition: all .2s;
    animation: fadeUp .4s .45s ease both;
  }
  .btn-home:active { transform: scale(.97); box-shadow: 0 4px 12px rgba(255,80,115,0.28); }
`;