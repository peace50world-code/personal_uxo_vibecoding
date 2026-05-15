"use client";

export default function Page() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gmarket+Sans:wght@300;500;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --pink-vivid:   #FF6B8B;
          --pink-mid:     #FFB6C8;
          --pink-soft:    #FFD6E3;
          --pink-pale:    #FFF0F5;
          --cream:        #FFFAF8;
          --brown:        #3D2030;
          --brown-light:  #8B5A6E;
          --brown-muted:  #C4A0AE;
          --white:        #FFFFFF;
        }

        html, body { height: 100%; background: #f0e8ec; }

        .shell {
          width: 100%;
          max-width: 390px;
          min-height: 100svh;
          margin: 0 auto;
          background: var(--cream);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          font-family: 'Noto Sans KR', -apple-system, sans-serif;
        }

        /* ── BG DECORATION ── */
        .bg-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 {
          width: 280px; height: 280px;
          top: -80px; right: -60px;
          background: radial-gradient(circle, #FFB6C8 0%, transparent 70%);
          opacity: 0.55;
          filter: blur(48px);
        }
        .blob-2 {
          width: 200px; height: 200px;
          top: 240px; left: -80px;
          background: radial-gradient(circle, #FFC8D8 0%, transparent 70%);
          opacity: 0.35;
          filter: blur(40px);
        }
        .blob-3 {
          width: 160px; height: 160px;
          bottom: 160px; right: -40px;
          background: radial-gradient(circle, #FFD6E3 0%, transparent 70%);
          opacity: 0.45;
          filter: blur(32px);
        }

        /* grain overlay */
        .grain {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 180px 180px;
        }

        /* ── SCROLL CONTENT ── */
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 56px 24px 0;
          position: relative;
          z-index: 2;
          padding-bottom: 220px;
        }

        /* ── HEADER ── */
        .header {
          width: 100%;
          text-align: center;
          margin-bottom: 36px;
        }
        .header-label {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--brown-muted);
          font-weight: 500;
          margin-bottom: 6px;
        }
        .header-title {
          font-family: 'Gmarket Sans', 'Noto Sans KR', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--brown);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .header-title .accent {
          color: var(--pink-vivid);
        }

        /* ── PIG CIRCLE ── */
        .pig-wrap {
          position: relative;
          margin-bottom: 32px;
        }
        .pig-glow {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            #FFB6C8 0%,
            #FF8FA8 25%,
            #FFDDE8 50%,
            #FF8FA8 75%,
            #FFB6C8 100%
          );
          opacity: 0.35;
          filter: blur(16px);
          animation: spin 8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pig-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1.5px dashed #FFB6C8;
          opacity: 0.6;
          animation: spin 24s linear infinite reverse;
        }
        .pig-circle {
          width: 196px;
          height: 196px;
          border-radius: 50%;
          background: linear-gradient(145deg, #FFD6E3 0%, #FFC0D0 40%, #FFB0C5 100%);
          box-shadow:
            0 20px 48px rgba(255, 107, 139, 0.28),
            0 4px 16px rgba(255, 107, 139, 0.15),
            inset 0 -6px 20px rgba(200, 60, 90, 0.08),
            inset 0 6px 20px rgba(255, 255, 255, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .pig-circle::before {
          content: '';
          position: absolute;
          top: 14px; left: 22px;
          width: 44px; height: 24px;
          background: rgba(255,255,255,0.35);
          border-radius: 50%;
          transform: rotate(-20deg);
          filter: blur(6px);
        }

        /* ── AMOUNT SECTION ── */
        .amount-section {
          width: 100%;
          text-align: center;
          margin-bottom: 20px;
        }
        .amount-label {
          font-size: 13px;
          color: var(--brown-muted);
          font-weight: 500;
          letter-spacing: 0.01em;
          margin-bottom: 4px;
        }
        .amount-value {
          font-family: 'Gmarket Sans', sans-serif;
          font-size: 52px;
          font-weight: 700;
          color: var(--brown);
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .amount-unit {
          font-size: 28px;
          font-weight: 700;
          color: var(--brown);
          font-family: 'Noto Sans KR', sans-serif;
          margin-left: 2px;
        }

        /* ── ACCUMULATED PILL ── */
        .pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--white);
          border: 1.5px solid var(--pink-soft);
          border-radius: 100px;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 700;
          color: var(--brown-light);
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(255, 107, 139, 0.08);
          transition: all 0.2s ease;
          font-family: 'Noto Sans KR', sans-serif;
        }
        .pill-btn:active {
          transform: scale(0.97);
          box-shadow: 0 1px 6px rgba(255, 107, 139, 0.12);
        }
        .pill-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--pink-vivid);
          flex-shrink: 0;
        }

        /* ── BOTTOM FIXED ── */
        .bottom-fixed {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 390px;
          z-index: 50;
          padding: 16px 20px 0;
          background: linear-gradient(to bottom, transparent, var(--cream) 28%);
        }

        .cta-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-primary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #FF7A97 0%, #FF5A80 55%, #F04870 100%);
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Noto Sans KR', sans-serif;
          letter-spacing: 0.01em;
          padding: 18px 24px;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          box-shadow:
            0 8px 24px rgba(255, 80, 115, 0.38),
            0 2px 8px rgba(255, 80, 115, 0.20),
            inset 0 1px 0 rgba(255,255,255,0.25);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 50%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.14), transparent);
          border-radius: 20px 20px 0 0;
          pointer-events: none;
        }
        .btn-primary:active {
          transform: scale(0.97) translateY(1px);
          box-shadow: 0 4px 12px rgba(255, 80, 115, 0.28);
        }

        .btn-secondary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: var(--pink-vivid);
          font-size: 16px;
          font-weight: 700;
          font-family: 'Noto Sans KR', sans-serif;
          letter-spacing: 0.01em;
          padding: 18px 24px;
          border: 1.5px solid var(--pink-soft);
          border-radius: 20px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(255, 107, 139, 0.10);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .btn-secondary:active {
          transform: scale(0.97) translateY(1px);
          background: var(--pink-pale);
        }

        .btn-icon {
          width: 22px; height: 22px;
          flex-shrink: 0;
          stroke-width: 2.5px;
        }

        /* ── BOTTOM NAV ── */
        .bottom-nav {
          display: flex;
          background: rgba(255, 250, 248, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 182, 200, 0.3);
          padding: 10px 0 max(14px, env(safe-area-inset-bottom));
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
          padding: 4px 0;
          position: relative;
        }
        .nav-item.active svg { stroke: var(--pink-vivid); }
        .nav-item.active .nav-label { color: var(--pink-vivid); }
        .nav-item:not(.active) svg { stroke: var(--brown-muted); }
        .nav-item:not(.active) .nav-label { color: var(--brown-muted); }
        .nav-label {
          font-size: 10px;
          font-weight: 700;
          font-family: 'Noto Sans KR', sans-serif;
          letter-spacing: 0.02em;
        }
        .nav-dot {
          position: absolute;
          bottom: -6px;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--pink-vivid);
        }

        /* ── STAGGER FADE IN ── */
        .content > * {
          opacity: 0;
          animation: fadeUp 0.5s ease forwards;
        }
        .header         { animation-delay: 0.05s; }
        .pig-wrap       { animation-delay: 0.15s; }
        .amount-section { animation-delay: 0.26s; }
        .pill-btn       { animation-delay: 0.34s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="shell">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />
        <div className="grain" />

        {/* ── CONTENT ── */}
        <div className="content">

          {/* HEADER */}
          <div className="header">
            <p className="header-label">My Piggy Bank</p>
            <h1 className="header-title">
              <span className="accent">쑥라떼</span>의 돼지 저금통
            </h1>
          </div>

          {/* PIG */}
          <div className="pig-wrap">
            <div className="pig-glow" />
            <div className="pig-ring" />
            <div className="pig-circle">
              <svg width="136" height="136" viewBox="0 0 136 136" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="26" cy="40" rx="18" ry="20" fill="#FFB0C5"/>
                <ellipse cx="26" cy="41" rx="11" ry="13" fill="#FF8FAB"/>
                <ellipse cx="110" cy="40" rx="18" ry="20" fill="#FFB0C5"/>
                <ellipse cx="110" cy="41" rx="11" ry="13" fill="#FF8FAB"/>
                <ellipse cx="68" cy="78" rx="50" ry="48" fill="#FFD6E3"/>
                <ellipse cx="52" cy="55" rx="14" ry="8" fill="rgba(255,255,255,0.40)" style={{filter:'blur(4px)'}}/>
                <rect x="58" y="34" width="20" height="4" rx="2" fill="rgba(200,80,110,0.30)"/>
                <ellipse cx="50" cy="66" rx="7" ry="8" fill="#3D2030"/>
                <ellipse cx="86" cy="66" rx="7" ry="8" fill="#3D2030"/>
                <circle cx="52.5" cy="63" r="2.5" fill="white"/>
                <circle cx="88.5" cy="63" r="2.5" fill="white"/>
                <circle cx="50.5" cy="68.5" r="1" fill="rgba(255,255,255,0.5)"/>
                <circle cx="86.5" cy="68.5" r="1" fill="rgba(255,255,255,0.5)"/>
                <ellipse cx="36" cy="80" rx="12" ry="8" fill="#FFB6C8" opacity="0.6"/>
                <ellipse cx="100" cy="80" rx="12" ry="8" fill="#FFB6C8" opacity="0.6"/>
                <ellipse cx="68" cy="92" rx="20" ry="15" fill="#FFB0C5"/>
                <ellipse cx="68" cy="89" rx="20" ry="8" fill="rgba(255,255,255,0.18)"/>
                <ellipse cx="61" cy="93" rx="5.5" ry="4.5" fill="rgba(180,60,90,0.30)"/>
                <ellipse cx="75" cy="93" rx="5.5" ry="4.5" fill="rgba(180,60,90,0.30)"/>
                <path d="M54 108 Q68 120 82 108" stroke="#D94F6B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
              </svg>
            </div>
          </div>

          {/* AMOUNT */}
          <div className="amount-section">
            <p className="amount-label">오늘 참은 금액</p>
            <p className="amount-value">
              0<span className="amount-unit">원</span>
            </p>
          </div>

          {/* PILL */}
          <button className="pill-btn">
            <span className="pill-dot" />
            누적 금액 0원
          </button>

        </div>

        {/* ── BOTTOM FIXED ── */}
        <div className="bottom-fixed">
          <div className="cta-stack">
            <a href="/record">
  <button className="btn-primary">
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="white" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              참은 소비 기록하기
            </button>
            </a>
            <button className="btn-secondary">
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{stroke:'var(--pink-vivid)'}}>
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              그룹 만들기
            </button>
          </div>

          <nav className="bottom-nav">
            <button className="nav-item active">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
              <span className="nav-label">홈</span>
              <span className="nav-dot" />
            </button>
            <button className="nav-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 21v-2a4 4 0 0 0-3-3.85" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="nav-label">그룹</span>
            </button>
          </nav>
        </div>

      </div>
    </>
  );
}