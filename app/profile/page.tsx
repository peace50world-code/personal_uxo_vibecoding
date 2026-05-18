"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getProfile, isLoggedIn, USER_KEY, SESSION_KEY, type UserProfile } from "../onboarding/page";

export default function ProfilePage() {
  const router = useRouter();

  const [profile,     setProfile]     = useState<UserProfile | null>(null);
  const [editing,     setEditing]     = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [saved,       setSaved]       = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p || !isLoggedIn()) { router.replace("/onboarding"); return; }
    setProfile(p);
    setNewNickname(p.nickname);
  }, [router]);

  // 편집 모드 진입 시 input 포커스
  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 100);
  }, [editing]);

  // ── 닉네임 저장 ──────────────────────────────────────
  const handleSave = () => {
    if (!newNickname.trim() || !profile) return;
    const updated: UserProfile = { ...profile, nickname: newNickname.trim() };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setProfile(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEditCancel = () => {
    setNewNickname(profile?.nickname ?? "");
    setEditing(false);
  };

  // ── 로그아웃 ─────────────────────────────────────────
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    router.replace("/onboarding");
  };

  if (!profile) return null;

  const avatarLetter = profile.nickname.charAt(0).toUpperCase();

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

        {/* ── 헤더: ← 내 프로필 ── */}
        <header className="page-header">
          <button className="back-btn" onClick={() => router.back()} aria-label="뒤로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </button>
          <h1 className="header-title">내 프로필</h1>
        </header>

        {/* ── 스크롤 콘텐츠 ── */}
        <main className="content">

          {/* 프로필 카드 */}
          <section className="profile-card">
            {/* 아바타 */}
            <div className="avatar-wrap">
              <div className="avatar">{avatarLetter}</div>
              <div className="avatar-pig">🐷</div>
            </div>

            {/* 닉네임 */}
            {editing ? (
              <div className="nickname-edit-wrap">
                <div className={`nickname-input-wrap ${newNickname ? "nickname-input-wrap--filled" : ""}`}>
                  <input
                    ref={inputRef}
                    className="nickname-input"
                    type="text"
                    value={newNickname}
                    maxLength={12}
                    onChange={e => setNewNickname(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleEditCancel(); }}
                    placeholder="닉네임 입력"
                  />
                  <span className="nickname-char-count">{newNickname.length}/12</span>
                </div>
                <div className="nickname-edit-btns">
                  <button className="btn-cancel" onClick={handleEditCancel}>취소</button>
                  <button
                    className={`btn-confirm ${!newNickname.trim() ? "btn-confirm--disabled" : ""}`}
                    onClick={handleSave}
                    disabled={!newNickname.trim()}
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <div className="nickname-row">
                <span className="nickname-text">{profile.nickname}</span>
                <button className="edit-btn" onClick={() => setEditing(true)} aria-label="닉네임 수정">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            )}

            {/* 저장 완료 토스트 */}
            {saved && (
              <div className="save-toast">✓ 닉네임이 변경됐어요</div>
            )}

            {/* 가입일 */}
            <p className="joined-date">
              {new Date(profile.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric"
              })} 시작
            </p>
          </section>

          {/* 설정 섹션 */}
          <section className="settings-section">
            <p className="settings-label">설정</p>

            <div className="settings-list">
              <button className="settings-item settings-item--disabled">
                <span className="settings-item-title">알림 설정</span>
                <ChevronRight />
              </button>
              <button className="settings-item settings-item--disabled">
                <span className="settings-item-title">개인정보 처리방침</span>
                <ChevronRight />
              </button>
              <button className="settings-item settings-item--disabled">
                <span className="settings-item-title">서비스 이용약관</span>
                <ChevronRight />
              </button>
              <div className="settings-item settings-item--version">
                <span className="settings-item-title">버전</span>
                <span className="settings-version-val">v1.0.0</span>
              </div>
            </div>
          </section>

          {/* 로그아웃 */}
          <div className="logout-wrap">
            <button className="btn-logout" onClick={() => setShowLogout(true)}>
              로그아웃
            </button>
          </div>

          <div style={{ height: 40 }} />
        </main>

        {/* ── 홈 인디케이터 ── */}
        <div className="home-indicator">
          <div className="home-pill" />
        </div>

        {/* ── 로그아웃 확인 모달 ── */}
        {showLogout && (
          <>
            <div className="modal-overlay" onClick={() => setShowLogout(false)} />
            <div className="modal-sheet">
              <div className="modal-handle" />
              <div className="modal-body">
                <p className="modal-title">로그아웃 할까요?</p>
                <p className="modal-desc">PIN을 기억하고 있다면<br />언제든 다시 로그인할 수 있어요</p>
              </div>
              <div className="modal-btns">
                <button className="modal-btn-cancel" onClick={() => setShowLogout(false)}>
                  취소
                </button>
                <button className="modal-btn-logout" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

// ─── 스타일 ─────────────────────────────────────────
const css = `
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
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #FFFFFF;
    border-bottom: 1px solid #F1F1F5;
    position: relative;
  }
  .back-btn {
    position: absolute;
    left: 16px;
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
    transition: background 0.15s;
  }
  .back-btn:active { background: #E5E5EC; }
  .header-title {
    font-size: 17px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.03em;
    margin: 0;
  }

  /* ── 스크롤 콘텐츠 ── */
  .content {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 20px 20px 0;
  }
  .content::-webkit-scrollbar { display: none; }

  /* ── 프로필 카드 ── */
  .profile-card {
    background: #FFFFFF;
    border-radius: 24px;
    padding: 32px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.05);
  }

  /* 아바타 */
  .avatar-wrap {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 4px;
  }
  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 28px;
    background: linear-gradient(135deg, #111111 0%, #444444 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.02em;
  }
  .avatar-pig {
    position: absolute;
    bottom: -4px;
    right: -6px;
    font-size: 22px;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
  }

  /* 닉네임 */
  .nickname-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nickname-text {
    font-size: 22px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.04em;
  }
  .edit-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F1F5;
    border: none;
    border-radius: 50%;
    color: #767676;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .edit-btn:hover { background: #E5E5EC; color: #111; }
  .edit-btn:active { transform: scale(0.92); }

  /* 닉네임 편집 */
  .nickname-edit-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: fadeUp 0.2s ease;
  }
  .nickname-input-wrap {
    display: flex;
    align-items: center;
    height: 52px;
    padding: 0 16px;
    background: #F7F7F7;
    border: 1.5px solid transparent;
    border-radius: 14px;
    transition: all 0.2s;
  }
  .nickname-input-wrap:focus-within {
    background: #FFFFFF;
    border-color: #111111;
    box-shadow: 0 0 0 3px rgba(17,17,17,0.07);
  }
  .nickname-input-wrap--filled { background: #FFFFFF; border-color: #E5E5EC; }
  .nickname-input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Pretendard', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #111111;
    letter-spacing: -0.02em;
    text-align: center;
  }
  .nickname-input::placeholder { color: #BBBBBB; font-weight: 400; }
  .nickname-char-count {
    font-size: 11px;
    color: #BBBBBB;
    flex-shrink: 0;
    margin-left: 6px;
  }
  .nickname-edit-btns {
    display: flex;
    gap: 8px;
  }
  .btn-cancel {
    flex: 1;
    height: 44px;
    background: #F1F1F5;
    border: none;
    border-radius: 12px;
    font-family: 'Pretendard', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #767676;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-cancel:active { background: #E5E5EC; }
  .btn-confirm {
    flex: 2;
    height: 44px;
    background: #111111;
    border: none;
    border-radius: 12px;
    font-family: 'Pretendard', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #FFFFFF;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-confirm:not(:disabled):active { background: #333333; }
  .btn-confirm--disabled { background: #E5E5EC; color: #BBBBBB; cursor: not-allowed; }

  /* 저장 완료 토스트 */
  .save-toast {
    font-size: 13px;
    font-weight: 600;
    color: #FFFFFF;
    background: #111111;
    padding: 7px 16px;
    border-radius: 100px;
    animation: fadeUp 0.25s ease;
  }

  /* 가입일 */
  .joined-date {
    font-size: 12px;
    color: #BBBBBB;
    letter-spacing: -0.01em;
    margin: 0;
  }

  /* ── 설정 섹션 ── */
  .settings-section {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 20px 20px 4px;
    margin-bottom: 16px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.05);
  }
  .settings-label {
    font-size: 13px;
    font-weight: 700;
    color: #767676;
    letter-spacing: -0.02em;
    margin: 0 0 8px 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .settings-list { display: flex; flex-direction: column; }
  .settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 4px;
    background: none;
    border: none;
    border-bottom: 1px solid #F7F7F7;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background 0.12s;
    color: #111111;
    -webkit-tap-highlight-color: transparent;
  }
  .settings-item:last-child { border-bottom: none; }
  .settings-item:not(.settings-item--disabled):not(.settings-item--version):active {
    background: #FAFAFA;
  }
  .settings-item--disabled { cursor: default; }
  .settings-item--version { cursor: default; }
  .settings-item-title {
    font-size: 15px;
    font-weight: 500;
    color: #111111;
    letter-spacing: -0.02em;
  }
  .settings-item--disabled .settings-item-title { color: #BBBBBB; }
  .settings-item--disabled svg { stroke: #D0D0D8; }
  .settings-version-val {
    font-size: 14px;
    font-weight: 500;
    color: #BBBBBB;
    letter-spacing: -0.01em;
  }

  /* ── 로그아웃 ── */
  .logout-wrap {
    padding: 0 0 8px;
  }
  .btn-logout {
    width: 100%;
    height: 52px;
    background: #FFFFFF;
    border: none;
    border-radius: 16px;
    font-family: 'Pretendard', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #FF4444;
    cursor: pointer;
    transition: background 0.15s;
    box-shadow: 0 1px 8px rgba(0,0,0,0.05);
    -webkit-tap-highlight-color: transparent;
  }
  .btn-logout:active { background: #FFF5F5; }

  /* ── 홈 인디케이터 ── */
  .home-indicator {
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #F7F7F7;
  }
  .home-pill {
    width: 134px;
    height: 5px;
    background: #111111;
    border-radius: 3px;
    opacity: 0.15;
  }

  /* ── 로그아웃 확인 모달 ── */
  .modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.40);
    z-index: 40;
    animation: fadeIn 0.2s ease;
  }
  .modal-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #FFFFFF;
    border-radius: 24px 24px 0 0;
    z-index: 50;
    padding-bottom: max(34px, env(safe-area-inset-bottom));
    animation: slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .modal-handle {
    width: 40px;
    height: 4px;
    background: #E5E5EC;
    border-radius: 100px;
    margin: 14px auto 0;
  }
  .modal-body { padding: 24px 24px 8px; text-align: center; }
  .modal-title {
    font-size: 18px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.03em;
    margin: 0 0 10px;
  }
  .modal-desc {
    font-size: 14px;
    color: #767676;
    line-height: 1.6;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .modal-btns {
    display: flex;
    gap: 10px;
    padding: 20px 24px 8px;
  }
  .modal-btn-cancel {
    flex: 1;
    height: 52px;
    background: #F1F1F5;
    border: none;
    border-radius: 14px;
    font-family: 'Pretendard', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #767676;
    cursor: pointer;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .modal-btn-cancel:active { background: #E5E5EC; }
  .modal-btn-logout {
    flex: 1;
    height: 52px;
    background: #FF4444;
    border: none;
    border-radius: 14px;
    font-family: 'Pretendard', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #FFFFFF;
    cursor: pointer;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .modal-btn-logout:active { background: #E03030; }

  /* ── 키프레임 ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
`;
