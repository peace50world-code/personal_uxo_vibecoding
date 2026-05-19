"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getProfile } from "../onboarding/page";

// ─── 그룹 데이터 타입 ─────────────────────────────────
export interface GroupMember {
  userId: string;
  nickname: string;
  joinedAt: string;
}

export interface PiggyGroup {
  id: string;
  name: string;
  createdAt: string;
  inviteCode: string;
  memberCount: number;
  members: GroupMember[];
}

export const GROUPS_KEY = "piggy-groups";

export function getGroups(): PiggyGroup[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function saveGroup(group: PiggyGroup) {
  try {
    const groups = getGroups();
    groups.unshift(group);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch (e) {
    console.error(e);
  }
}

function findGroupByCode(code: string): PiggyGroup | null {
  return getGroups().find(g => g.inviteCode === code.toUpperCase()) ?? null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1)  return "방금 생성";
  if (diffMin < 60) return `${diffMin}분 전 생성`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}시간 전 생성`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 생성`;
}

// ─── 친구 / 그룹 목록 페이지 ─────────────────────────
export default function FriendsPage() {
  const [groups,     setGroups]     = useState<PiggyGroup[]>([]);
  const [showModal,  setShowModal]  = useState(false);
  const [groupName,  setGroupName]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [done,       setDone]       = useState(false);
  // 코드 참가 모달
  const [showJoin,   setShowJoin]   = useState(false);
  const [joinCode,   setJoinCode]   = useState("");
  const [joinError,  setJoinError]  = useState(false);
  const [joinDone,   setJoinDone]   = useState<string | null>(null); // 참가한 그룹 id
  const inputRef  = useRef<HTMLInputElement>(null);
  const joinRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGroups(getGroups());
  }, []);

  // 그룹 만들기 모달 포커스
  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 200);
  }, [showModal]);

  // 코드 참가 모달 포커스
  useEffect(() => {
    if (showJoin) setTimeout(() => joinRef.current?.focus(), 200);
  }, [showJoin]);

  const openModal  = () => { setGroupName(""); setDone(false); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setGroupName(""); setSaving(false); setDone(false); };

  const handleCreate = () => {
    if (!groupName.trim() || saving) return;
    setSaving(true);
    setTimeout(() => {
      const profile = getProfile();
      const creator: GroupMember = profile
        ? { userId: profile.userId, nickname: profile.nickname, joinedAt: new Date().toISOString() }
        : { userId: "unknown", nickname: "나", joinedAt: new Date().toISOString() };
      const group: PiggyGroup = {
        id: Date.now().toString(),
        name: groupName.trim(),
        createdAt: new Date().toISOString(),
        inviteCode: generateInviteCode(),
        memberCount: 1,
        members: [creator],
      };
      saveGroup(group);
      setGroups(getGroups());
      setSaving(false);
      setDone(true);
      setTimeout(() => closeModal(), 900);
    }, 600);
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) return;
    const found = findGroupByCode(code);
    if (!found) {
      setJoinError(true);
      setTimeout(() => setJoinError(false), 2000);
      return;
    }
    // 현재 사용자를 멤버에 추가 (중복 방지)
    const profile = getProfile();
    if (profile) {
      const alreadyMember = (found.members ?? []).some(m => m.userId === profile.userId);
      if (!alreadyMember) {
        const newMember: GroupMember = { userId: profile.userId, nickname: profile.nickname, joinedAt: new Date().toISOString() };
        const updatedGroup: PiggyGroup = {
          ...found,
          members: [...(found.members ?? []), newMember],
          memberCount: (found.memberCount ?? 0) + 1,
        };
        const all = getGroups();
        localStorage.setItem(GROUPS_KEY, JSON.stringify(all.map(g => g.id === found.id ? updatedGroup : g)));
      }
    }
    setJoinDone(found.id);
    setTimeout(() => {
      setShowJoin(false);
      setJoinCode("");
      setJoinDone(null);
      window.location.href = `/group/${found.id}`;
    }, 1000);
  };

  const openJoin  = () => { setJoinCode(""); setJoinError(false); setJoinDone(null); setShowJoin(true); };
  const closeJoin = () => { setShowJoin(false); setJoinCode(""); setJoinError(false); setJoinDone(null); };

  const canCreate = groupName.trim().length > 0 && !saving;

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

        {/* ── 헤더: 내 그룹 + 코드 입력 + + 버튼 ── */}
        <header className="page-header">
          <h1 className="page-title">내 그룹</h1>
          <div className="header-actions">
            <button className="icon-btn" onClick={openJoin} aria-label="코드로 참가">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            <button className="add-btn" onClick={openModal} aria-label="그룹 추가">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5"  y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* ── 콘텐츠 ── */}
        <main className="content">
          {groups.length === 0 ? (

            /* 빈 상태 */
            <div className="empty-state">
              <div className="empty-pig">🐷</div>
              <p className="empty-title">아직 그룹이 없어요</p>
              <p className="empty-sub">
                친구들과 함께 절약 챌린지를 시작해보세요!
              </p>
              <div className="empty-cta-group">
                <button className="empty-cta" onClick={openModal}>
                  그룹 만들기
                </button>
                <button className="empty-cta-secondary" onClick={openJoin}>
                  코드로 참가하기
                </button>
              </div>
            </div>

          ) : (

            /* 그룹 목록 */
            <div className="group-list">
              {groups.map(g => (
                <button key={g.id} className="group-card" onClick={() => window.location.href = `/group/${g.id}`}>
                  <div className="group-card-left">
                    <div className="group-avatar">
                      {g.name.charAt(0)}
                    </div>
                    <div className="group-info">
                      <div className="group-name-row">
                        <span className="group-name">{g.name}</span>
                        <span className="group-member-count">{g.members?.length ?? g.memberCount ?? 1}</span>
                      </div>
                      <span className="group-last">{formatDate(g.createdAt)}</span>
                    </div>
                  </div>
                  <div className="group-card-right">
                    <span className="group-fire">🔥</span>
                    <span className="group-fire-count">0</span>
                  </div>
                </button>
              ))}
            </div>

          )}

          <div style={{ height: 32 }} />
        </main>

        {/* ── 하단 네비게이션 ── */}
        <nav className="bottom-nav">
          <Link href="/" className="nav-item" aria-label="홈">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3L21 9.5V20a1 1 0 0 1-1 1H15v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/>
            </svg>
            <span>홈</span>
          </Link>
          <Link href="/friends" className="nav-item nav-item--active" aria-label="친구">
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

        {/* ── 코드로 참가 모달 ── */}
        {showJoin && (
          <>
            <div className="modal-overlay" onClick={closeJoin} />
            <div className="modal-sheet modal-sheet--open">
              <div className="modal-handle" />

              {joinDone ? (
                <div className="modal-done">
                  <span className="modal-done-icon">🎉</span>
                  <p className="modal-done-text">그룹에 참가했어요!</p>
                </div>
              ) : (
                <>
                  <div className="modal-body">
                    <p className="modal-label">초대 코드 입력</p>
                    <div className={`join-code-wrap ${joinError ? "join-code-wrap--error" : ""} ${joinCode.length === 6 ? "join-code-wrap--filled" : ""}`}>
                      <input
                        ref={joinRef}
                        className="join-code-input"
                        type="text"
                        placeholder="AB3D7K"
                        value={joinCode}
                        maxLength={6}
                        autoCapitalize="characters"
                        onChange={e => {
                          setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                          setJoinError(false);
                        }}
                        onKeyDown={e => { if (e.key === "Enter") handleJoin(); }}
                      />
                    </div>
                    {joinError ? (
                      <p className="join-error-text">유효하지 않은 초대 코드예요</p>
                    ) : (
                      <p className="join-hint">친구에게 받은 6자리 코드를 입력하세요</p>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      className={`modal-btn-save ${joinCode.length < 6 ? "modal-btn-save--disabled" : ""}`}
                      onClick={handleJoin}
                      disabled={joinCode.length < 6}
                    >
                      참가하기
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── 그룹 생성 모달 (Nickname 스타일) ── */}
        {showModal && (
          <>
            {/* 오버레이 */}
            <div className="modal-overlay" onClick={closeModal} />

            {/* 바텀 시트 */}
            <div className={`modal-sheet ${showModal ? "modal-sheet--open" : ""}`}>
              <div className="modal-handle" />

              {done ? (
                /* 완료 상태 */
                <div className="modal-done">
                  <span className="modal-done-icon">🎉</span>
                  <p className="modal-done-text">그룹이 만들어졌어요!</p>
                </div>
              ) : (
                /* 입력 상태 */
                <>
                  <div className="modal-body">
                    <p className="modal-label">그룹 이름을 입력하세요</p>
                    <div className={`modal-input-wrap ${groupName ? "modal-input-wrap--filled" : ""}`}>
                      <input
                        ref={inputRef}
                        className="modal-input"
                        type="text"
                        placeholder="예) 지독한 21학번, 절약왕 모임"
                        value={groupName}
                        maxLength={20}
                        onChange={e => setGroupName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                      />
                      {groupName && (
                        <button className="modal-input-clear" onClick={() => setGroupName("")}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6"  x2="6"  y2="18"/>
                            <line x1="6"  y1="6"  x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    {groupName && (
                      <p className="modal-count">{groupName.length} / 20</p>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      className={`modal-btn-save ${!canCreate ? "modal-btn-save--disabled" : ""} ${saving ? "modal-btn-save--loading" : ""}`}
                      onClick={handleCreate}
                      disabled={!canCreate}
                    >
                      {saving ? <span className="spinner" /> : "저장하기"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

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
    -webkit-tap-highlight-color: transparent;
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

  /* ── 헤더 ── */
  .page-header {
    height: 60px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    background: #FFFFFF;
    border-bottom: 1px solid #F1F1F5;
  }
  .page-title {
    font-size: 22px;
    font-weight: 800;
    color: #111111;
    letter-spacing: -0.04em;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F1F5;
    color: #111111;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .icon-btn:active { background: #E5E5EC; transform: scale(0.94); }
  .add-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111111;
    color: #FFFFFF;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .add-btn:active { background: #333333; transform: scale(0.94); }

  /* ── 스크롤 콘텐츠 ── */
  .content {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .content::-webkit-scrollbar { display: none; }

  /* ── 빈 상태 ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 32px 40px;
    gap: 10px;
    min-height: 60%;
  }
  .empty-pig {
    font-size: 56px;
    line-height: 1;
    margin-bottom: 8px;
    animation: pigBounce 1.6s ease-in-out infinite;
  }
  .empty-title {
    font-size: 18px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.03em;
  }
  .empty-sub {
    font-size: 13px;
    color: #767676;
    text-align: center;
    line-height: 1.7;
    letter-spacing: -0.01em;
  }
  .empty-sub strong { color: #FF2A7A; font-weight: 700; }
  .empty-cta {
    margin-top: 16px;
    height: 48px;
    padding: 0 28px;
    background: #FF2A7A;
    color: #FFFFFF;
    font-family: 'Pretendard', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.01em;
    border: none;
    border-radius: 100px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(255, 42, 122, 0.30);
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .empty-cta:active { transform: scale(0.96); box-shadow: 0 2px 8px rgba(255, 42, 122, 0.20); }

  .empty-cta-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }
  .empty-cta-secondary {
    height: 48px;
    padding: 0 28px;
    background: transparent;
    color: #111111;
    font-family: 'Pretendard', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    border: 1.5px solid #E5E5EC;
    border-radius: 100px;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .empty-cta-secondary:active { background: #F7F7F7; transform: scale(0.96); }

  /* ── 코드 입력 필드 ── */
  .join-code-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 72px;
    background: #F7F7F7;
    border: 1.5px solid transparent;
    border-radius: 16px;
    transition: all 0.2s;
    margin-bottom: 10px;
  }
  .join-code-wrap:focus-within {
    background: #FFFFFF;
    border-color: #FF2A7A;
    box-shadow: 0 0 0 3px rgba(255, 42, 122, 0.10);
  }
  .join-code-wrap--filled {
    background: #FFFFFF;
    border-color: #E5E5EC;
  }
  .join-code-wrap--error {
    border-color: #FF3B30 !important;
    box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.10) !important;
    animation: shake 0.35s cubic-bezier(.36,.07,.19,.97);
  }
  .join-code-input {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Pretendard', -apple-system, monospace, sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #111111;
    letter-spacing: 0.18em;
    text-align: center;
    text-transform: uppercase;
  }
  .join-code-input::placeholder {
    color: #CCCCCC;
    font-weight: 500;
    letter-spacing: 0.12em;
    font-size: 22px;
  }
  .join-error-text {
    font-size: 13px;
    color: #FF3B30;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  .join-hint {
    font-size: 13px;
    color: #BBBBBB;
    letter-spacing: -0.01em;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }

  /* ── 그룹 목록 ── */
  .group-list {
    padding: 12px 20px 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .group-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #F7F7F7;
    background: none;
    border-left: none;
    border-right: none;
    border-top: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.12s;
  }
  .group-card:first-child { border-top: 1px solid #F7F7F7; }
  .group-card:active { background: #FAFAFA; }
  .group-card-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }
  .group-avatar {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    background: linear-gradient(135deg, #111111 0%, #444444 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.02em;
    flex-shrink: 0;
  }
  .group-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .group-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .group-name {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }
  .group-member-count {
    font-size: 12px;
    font-weight: 600;
    color: #FFFFFF;
    background: #767676;
    padding: 1px 7px;
    border-radius: 100px;
    flex-shrink: 0;
  }
  .group-last {
    font-size: 12px;
    color: #BBBBBB;
    letter-spacing: -0.01em;
  }
  .group-card-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    margin-left: 12px;
  }
  .group-fire { font-size: 18px; line-height: 1; }
  .group-fire-count {
    font-size: 12px;
    font-weight: 700;
    color: #767676;
    letter-spacing: -0.01em;
  }

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
    text-decoration: none;
  }
  .nav-item svg { stroke: #CCCCCC; }
  .nav-item--active { color: #FF2A7A; }
  .nav-item--active svg { stroke: #FF2A7A; }

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

  /* ── 모달 오버레이 ── */
  .modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 40;
    animation: fadeIn 0.2s ease;
  }

  /* ── 바텀 시트 ── */
  .modal-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #FFFFFF;
    border-radius: 24px 24px 0 0;
    z-index: 50;
    padding-bottom: max(34px, env(safe-area-inset-bottom));
    animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .modal-handle {
    width: 40px;
    height: 4px;
    background: #E5E5EC;
    border-radius: 100px;
    margin: 14px auto 0;
  }
  .modal-body {
    padding: 28px 24px 0;
  }
  .modal-label {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
  }
  .modal-input-wrap {
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 16px;
    background: #F7F7F7;
    border: 1.5px solid transparent;
    border-radius: 16px;
    transition: all 0.2s;
  }
  .modal-input-wrap:focus-within {
    background: #FFFFFF;
    border-color: #FF2A7A;
    box-shadow: 0 0 0 3px rgba(255, 42, 122, 0.10);
  }
  .modal-input-wrap--filled {
    background: #FFFFFF;
    border-color: #E5E5EC;
  }
  .modal-input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Pretendard', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #111111;
    letter-spacing: -0.01em;
  }
  .modal-input::placeholder { color: #BBBBBB; font-weight: 400; }
  .modal-input-clear {
    background: none;
    border: none;
    cursor: pointer;
    color: #BBBBBB;
    display: flex;
    align-items: center;
    padding: 4px;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .modal-input-clear:hover { color: #767676; }
  .modal-count {
    margin-top: 6px;
    padding-left: 4px;
    font-size: 12px;
    color: #BBBBBB;
    text-align: right;
  }

  /* ── 모달 푸터 ── */
  .modal-footer {
    padding: 20px 24px 8px;
  }
  .modal-btn-save {
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
  .modal-btn-save:not(:disabled):active {
    transform: scale(0.97);
    box-shadow: 0 3px 10px rgba(255, 42, 122, 0.20);
  }
  .modal-btn-save--disabled {
    background: #F1F1F5;
    color: #BBBBBB;
    box-shadow: none;
    cursor: not-allowed;
  }
  .modal-btn-save--loading { pointer-events: none; }

  /* ── 완료 상태 ── */
  .modal-done {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 36px 24px 40px;
    gap: 12px;
    animation: fadeUp 0.3s ease;
  }
  .modal-done-icon { font-size: 48px; line-height: 1; }
  .modal-done-text {
    font-size: 17px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.03em;
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

  /* ── 키프레임 ── */
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pigBounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }
`;
