"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, generateInviteCode, backfillTodayRecords } from "@/lib/supabase";
import { getProfile } from "../onboarding/page";

interface PiggyGroup {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  member_count?: number;
  last_update_at?: string | null;
  last_updater?: string | null;
}

type ModalMode = "create" | "join" | "invite";

// 모듈 레벨 캐시 — 컴포넌트가 언마운트돼도 유지됨
let _groupsCache: PiggyGroup[] | null = null;

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1)  return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function FriendsPage() {
  const [groups,      setGroups]      = useState<PiggyGroup[]>(_groupsCache ?? []);
  const [loading,     setLoading]     = useState(_groupsCache === null);
  const [modalMode,   setModalMode]   = useState<ModalMode | null>(null);
  const [groupName,   setGroupName]   = useState("");
  const [joinCode,    setJoinCode]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState("");
  const [inviteGroup, setInviteGroup] = useState<PiggyGroup | null>(null);
  const [copied,      setCopied]      = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const nickname = getProfile()?.nickname ?? "익명";

  async function loadGroups() {
    // 캐시가 없을 때만 로딩 스피너 표시
    if (_groupsCache === null) setLoading(true);

    // 쿼리 1: 내가 속한 그룹 정보를 한 번에 join해서 가져오기
    const { data: myMemberships } = await supabase
      .from("group_members")
      .select("group_id, groups(*)")
      .eq("nickname", nickname);

    if (!myMemberships || myMemberships.length === 0) {
      _groupsCache = [];
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = myMemberships.map(r => r.group_id);

    // 쿼리 2 + 3: 멤버 목록 / 최신 기록 병렬 fetch
    const [{ data: allMembers }, { data: allRecords }] = await Promise.all([
      supabase.from("group_members").select("group_id").in("group_id", groupIds),
      supabase.from("records")
        .select("group_id, nickname, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false }),
    ]);

    const countMap: Record<string, number> = {};
    (allMembers ?? []).forEach(m => {
      countMap[m.group_id] = (countMap[m.group_id] ?? 0) + 1;
    });

    // 각 그룹의 최신 기록 1건 (records는 created_at 내림차순)
    const latestMap: Record<string, { nickname: string; created_at: string }> = {};
    (allRecords ?? []).forEach(r => {
      if (!latestMap[r.group_id]) {
        latestMap[r.group_id] = { nickname: r.nickname, created_at: r.created_at };
      }
    });

    const groups = myMemberships
      .map(r => {
        const latest = latestMap[r.group_id];
        return {
          ...(r.groups as any),
          member_count: countMap[r.group_id] ?? 1,
          last_update_at: latest?.created_at ?? null,
          last_updater:   latest?.nickname   ?? null,
        };
      })
      // 최근 업데이트가 있는 그룹을 우선, 동률이면 생성시각순
      .sort((a, b) => {
        const aTs = a.last_update_at ?? a.created_at;
        const bTs = b.last_update_at ?? b.created_at;
        return new Date(bTs).getTime() - new Date(aTs).getTime();
      });

    _groupsCache = groups;
    setGroups(groups);
    setLoading(false);
  }

  useEffect(() => { loadGroups(); }, []);

  useEffect(() => {
    if (modalMode) setTimeout(() => inputRef.current?.focus(), 200);
  }, [modalMode]);

  function openCreate() { setGroupName(""); setDone(false); setError(""); setModalMode("create"); }
  function openJoin()   { setJoinCode("");  setDone(false); setError(""); setModalMode("join"); }
  function closeModal() { setModalMode(null); setSaving(false); setDone(false); setError(""); setInviteGroup(null); }

  async function handleCreate() {
    if (!groupName.trim() || saving) return;
    setSaving(true);
    setError("");

    let code = generateInviteCode();
    // 중복 코드 방지
    let { data: existing } = await supabase.from("groups").select("id").eq("invite_code", code);
    while (existing && existing.length > 0) {
      code = generateInviteCode();
      ({ data: existing } = await supabase.from("groups").select("id").eq("invite_code", code));
    }

    const { data: group, error: gErr } = await supabase
      .from("groups")
      .insert({ name: groupName.trim(), invite_code: code })
      .select()
      .single();

    if (gErr || !group) { setError("그룹 생성에 실패했어요."); setSaving(false); return; }

    await supabase.from("group_members").insert({ group_id: group.id, nickname });
    // 가입 당일 로컬에 기록된 절약 내역을 그룹에 합쳐주기
    await backfillTodayRecords(group.id, nickname);

    setSaving(false);
    setDone(true);
    await loadGroups();
    setTimeout(() => {
      closeModal();
      setInviteGroup(group);
      setModalMode("invite");
    }, 900);
  }

  async function handleJoin() {
    if (!joinCode.trim() || saving) return;
    setSaving(true);
    setError("");

    const { data: group } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", joinCode.trim().toUpperCase())
      .single();

    if (!group) { setError("존재하지 않는 코드예요. 다시 확인해주세요."); setSaving(false); return; }

    // 이미 멤버인지 확인
    const { data: already } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("nickname", nickname)
      .single();

    if (already) { setError("이미 참가한 그룹이에요!"); setSaving(false); return; }

    await supabase.from("group_members").insert({ group_id: group.id, nickname });
    // 가입 당일 로컬에 기록된 절약 내역을 그룹에 합쳐주기
    await backfillTodayRecords(group.id, nickname);

    setSaving(false);
    setDone(true);
    await loadGroups();
    setTimeout(() => closeModal(), 1200);
  }

  const APP_URL = "https://personal-uxo-vibecoding-k4sv.vercel.app";

  function handleShare(group: PiggyGroup) {
    const url  = `${APP_URL}/join/${group.invite_code}`;
    const text = `🐷 참아낸다이어 절약 챌린지!\n'${nickname}'님이 '${group.name}'에 초대합니다\n\n파티 코드 : ${group.invite_code}\n${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: `${group.name} 그룹 초대`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* 상태바 여백 (UI 없이 여백만) */}
        <div className="status-bar" />

        {/* 헤더 */}
        <header className="page-header">
          <h1 className="page-title">내 그룹</h1>
          <div className="header-btns">
            <button className="join-btn" onClick={openJoin}>코드 참가</button>
            <button className="add-btn" onClick={openCreate} aria-label="그룹 추가">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5"  y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* 콘텐츠 */}
        <main className="content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-lg" />
              <p>불러오는 중...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-pig">🐷</div>
              <p className="empty-title">아직 그룹이 없어요</p>
              <p className="empty-sub">
                친구들과 함께 절약 챌린지를 시작해보세요!
              </p>
              <div className="empty-btns">
                <button className="empty-cta" onClick={openCreate}>그룹 만들기</button>
                <button className="empty-cta empty-cta--outline" onClick={openJoin}>코드로 참가</button>
              </div>
            </div>
          ) : (
            <div className="group-list">
              {groups.map(g => (
                <div key={g.id} className="group-card-wrap">
                  <button className="group-card" onClick={() => router.push(`/group/${g.id}`)}>
                    <div className="group-card-left">
                      <div className="group-avatar">{g.name.charAt(0)}</div>
                      <div className="group-info">
                        <div className="group-name-row">
                          <span className="group-name">{g.name}</span>
                          <span className="group-member-count">{g.member_count}</span>
                        </div>
                        <span className="group-last">
                          {g.last_update_at && g.last_updater
                            ? `${formatRelative(g.last_update_at)} · ${g.last_updater}님 업데이트`
                            : "아직 기록이 없어요"}
                        </span>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#CCCCCC" strokeWidth="2" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                  <button className="invite-btn" onClick={() => handleShare(g)}>
                    초대 코드 공유
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ height: 32 }} />
        </main>

        {/* 하단 네비게이션 */}
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

        {/* ── 그룹 만들기 모달 ── */}
        {modalMode === "create" && (
          <>
            <div className="modal-overlay" onClick={closeModal} />
            <div className="modal-sheet">
              <div className="modal-handle" />
              {done ? (
                <div className="modal-done">
                  <span className="modal-done-icon">🎉</span>
                  <p className="modal-done-text">그룹이 만들어졌어요!</p>
                  <p className="modal-done-sub">초대 코드를 공유해서 친구를 초대하세요</p>
                </div>
              ) : (
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
                        onChange={e => { setGroupName(e.target.value); setError(""); }}
                        onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                      />
                      {groupName && (
                        <button className="modal-input-clear" onClick={() => setGroupName("")}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6"  y2="18"/>
                            <line x1="6"  y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    {error && <p className="modal-error">{error}</p>}
                  </div>
                  <div className="modal-footer">
                    <button
                      className={`modal-btn-save ${!groupName.trim() ? "modal-btn-save--disabled" : ""}`}
                      onClick={handleCreate}
                      disabled={!groupName.trim() || saving}
                    >
                      {saving ? <span className="spinner" /> : "그룹 만들기"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── 코드로 참가 모달 ── */}
        {modalMode === "join" && (
          <>
            <div className="modal-overlay" onClick={closeModal} />
            <div className="modal-sheet">
              <div className="modal-handle" />
              {done ? (
                <div className="modal-done">
                  <span className="modal-done-icon">🥳</span>
                  <p className="modal-done-text">그룹에 참가했어요!</p>
                </div>
              ) : (
                <>
                  <div className="modal-body">
                    <p className="modal-label">초대 코드를 입력하세요</p>
                    <p className="modal-sublabel">친구에게 받은 6자리 코드를 입력하세요</p>
                    <div className={`modal-input-wrap ${joinCode ? "modal-input-wrap--filled" : ""}`}>
                      <input
                        ref={inputRef}
                        className="modal-input modal-input--code"
                        type="text"
                        placeholder="예) AB3D5F"
                        value={joinCode}
                        maxLength={6}
                        onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
                        onKeyDown={e => { if (e.key === "Enter") handleJoin(); }}
                      />
                    </div>
                    {error && <p className="modal-error">{error}</p>}
                  </div>
                  <div className="modal-footer">
                    <button
                      className={`modal-btn-save ${!joinCode.trim() ? "modal-btn-save--disabled" : ""}`}
                      onClick={handleJoin}
                      disabled={!joinCode.trim() || saving}
                    >
                      {saving ? <span className="spinner" /> : "참가하기"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── 초대 코드 공유 모달 ── */}
        {modalMode === "invite" && inviteGroup && (
          <>
            <div className="modal-overlay" onClick={closeModal} />
            <div className="modal-sheet">
              <div className="modal-handle" />
              <div className="modal-body">
                <p className="modal-label">친구 초대하기</p>
                <p className="modal-sublabel">링크를 공유하면 코드 입력 없이 바로 참가해요</p>
                <div className="invite-code-box">
                  <div>
                    <p className="invite-group-label">{inviteGroup.name}</p>
                    <p className="invite-link-text">{`/join/${inviteGroup.invite_code}`}</p>
                  </div>
                  <span className="invite-code-badge">{inviteGroup.invite_code}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn-save" onClick={() => { handleShare(inviteGroup); }}>
                  {copied ? "복사됨 ✓" : "🔗 공유하기"}
                </button>
                <button className="modal-btn-cancel" onClick={closeModal}>닫기</button>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}

const css = `
  .shell {
    width: 100%; max-width: 402px; height: 100svh; margin: 0 auto;
    background: #FFFFFF; display: flex; flex-direction: column;
    overflow: hidden; font-family: 'Pretendard', -apple-system, sans-serif;
    position: relative; -webkit-tap-highlight-color: transparent;
  }
  .status-bar { height: 44px; flex-shrink: 0; }
  .page-header {
    height: 60px; padding: 0 20px; display: flex; align-items: center;
    justify-content: space-between; flex-shrink: 0;
    border-bottom: 1px solid #F1F1F5;
  }
  .page-title { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.04em; }
  .header-btns { display: flex; align-items: center; gap: 8px; }
  .join-btn {
    height: 34px; padding: 0 14px; background: #F1F1F5; color: #444;
    font-family: 'Pretendard', sans-serif; font-size: 13px; font-weight: 600;
    border: none; border-radius: 100px; cursor: pointer; transition: all 0.15s;
  }
  .join-btn:active { background: #E5E5EC; }
  .add-btn {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    background: #111; color: #fff; border: none; border-radius: 50%; cursor: pointer;
    transition: all 0.15s;
  }
  .add-btn:active { background: #333; transform: scale(0.94); }
  .content { flex: 1; overflow-y: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .content::-webkit-scrollbar { display: none; }
  .loading-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 80px 0; gap: 16px; color: #BBBBBB; font-size: 14px;
  }
  .spinner-lg {
    width: 32px; height: 32px; border-radius: 50%;
    border: 3px solid #F1F1F5; border-top-color: #FF2A7A;
    animation: spin 0.7s linear infinite;
  }
  .empty-state {
    display: flex; flex-direction: column; align-items: center;
    padding: 60px 32px 40px; gap: 10px;
  }
  .empty-pig { font-size: 56px; animation: pigBounce 1.6s ease-in-out infinite; }
  .empty-title { font-size: 18px; font-weight: 700; color: #111; letter-spacing: -0.03em; }
  .empty-sub { font-size: 13px; color: #767676; text-align: center; line-height: 1.7; }
  .empty-btns { display: flex; flex-direction: column; gap: 10px; width: 100%; margin-top: 8px; }
  .empty-cta {
    height: 48px; padding: 0 28px; background: #FF2A7A; color: #fff;
    font-family: 'Pretendard', sans-serif; font-size: 15px; font-weight: 700;
    border: none; border-radius: 100px; cursor: pointer;
    box-shadow: 0 4px 16px rgba(255,42,122,0.30); transition: all 0.15s;
  }
  .empty-cta--outline {
    background: #fff; color: #FF2A7A; border: 1.5px solid #FF2A7A; box-shadow: none;
  }
  .empty-cta:active { transform: scale(0.96); }
  .group-list { padding: 12px 20px 0; display: flex; flex-direction: column; gap: 0; }
  .group-card-wrap { border-bottom: 1px solid #F7F7F7; }
  .group-card-wrap:first-child { border-top: 1px solid #F7F7F7; }
  .group-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0 8px; background: none; border: none;
    cursor: pointer; width: 100%; text-align: left; transition: background 0.12s;
  }
  .group-card:active { background: #FAFAFA; }
  .group-card-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
  .group-avatar {
    width: 46px; height: 46px; border-radius: 16px;
    background: linear-gradient(135deg, #111 0%, #444 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; color: #fff; flex-shrink: 0;
  }
  .group-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .group-name-row { display: flex; align-items: center; gap: 6px; }
  .group-name {
    font-size: 15px; font-weight: 700; color: #111; letter-spacing: -0.02em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;
  }
  .group-member-count {
    font-size: 12px; font-weight: 600; color: #fff;
    background: #767676; padding: 1px 7px; border-radius: 100px; flex-shrink: 0;
  }
  .group-last { font-size: 12px; color: #BBBBBB; }
  .invite-btn {
    margin: 4px 0 14px; height: 34px; width: 100%;
    background: #FFF0F6; color: #FF2A7A;
    font-family: 'Pretendard', sans-serif; font-size: 13px; font-weight: 600;
    border: 1px solid #FFD0E5; border-radius: 10px; cursor: pointer; transition: all 0.15s;
  }
  .invite-btn:active { background: #FFE0EF; }
  .bottom-nav {
    height: 64px; display: flex; align-items: center; background: #fff;
    border-top: 1px solid #F1F1F5; flex-shrink: 0; padding: 0 40px;
  }
  .nav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    background: none; border: none; cursor: pointer;
    font-family: 'Pretendard', sans-serif; font-size: 10px; font-weight: 600;
    color: #CCCCCC; letter-spacing: -0.01em; transition: color 0.15s;
    padding: 0; text-decoration: none;
  }
  .nav-item svg { stroke: #CCCCCC; }
  .nav-item--active { color: #FF2A7A; }
  .nav-item--active svg { stroke: #FF2A7A; }
  .home-indicator {
    height: 34px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .home-pill { width: 134px; height: 5px; background: #111; border-radius: 3px; }
  .modal-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.45); z-index: 40;
    animation: fadeIn 0.2s ease;
  }
  .modal-sheet {
    position: absolute; bottom: 0; left: 0; right: 0; background: #fff;
    border-radius: 24px 24px 0 0; z-index: 50;
    padding-bottom: max(34px, env(safe-area-inset-bottom));
    animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .modal-handle {
    width: 40px; height: 4px; background: #E5E5EC;
    border-radius: 100px; margin: 14px auto 0;
  }
  .modal-body { padding: 28px 24px 0; }
  .modal-label { font-size: 16px; font-weight: 700; color: #111; letter-spacing: -0.03em; margin-bottom: 6px; }
  .modal-sublabel { font-size: 13px; color: #767676; margin-bottom: 16px; }
  .modal-input-wrap {
    display: flex; align-items: center; height: 56px; padding: 0 16px;
    background: #F7F7F7; border: 1.5px solid transparent; border-radius: 16px; transition: all 0.2s;
  }
  .modal-input-wrap:focus-within { background: #fff; border-color: #FF2A7A; box-shadow: 0 0 0 3px rgba(255,42,122,0.10); }
  .modal-input-wrap--filled { background: #fff; border-color: #E5E5EC; }
  .modal-input {
    flex: 1; height: 100%; background: transparent; border: none; outline: none;
    font-family: 'Pretendard', sans-serif; font-size: 15px; font-weight: 500; color: #111;
  }
  .modal-input--code { font-size: 20px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
  .modal-input::placeholder { color: #BBBBBB; font-weight: 400; }
  .modal-input-clear {
    background: none; border: none; cursor: pointer; color: #BBBBBB;
    display: flex; align-items: center; padding: 4px;
  }
  .modal-error { margin-top: 8px; font-size: 13px; color: #FF2A7A; padding-left: 4px; }
  .modal-footer { padding: 20px 24px 8px; }
  .modal-btn-save {
    width: 100%; height: 56px; display: flex; align-items: center; justify-content: center;
    background: #FF2A7A; color: #fff;
    font-family: 'Pretendard', sans-serif; font-size: 16px; font-weight: 700;
    border: none; border-radius: 16px; cursor: pointer;
    box-shadow: 0 6px 20px rgba(255,42,122,0.30); transition: all 0.2s;
  }
  .modal-btn-save:not(:disabled):active { transform: scale(0.97); }
  .modal-btn-save--disabled { background: #F1F1F5; color: #BBBBBB; box-shadow: none; cursor: not-allowed; }
  .modal-done {
    display: flex; flex-direction: column; align-items: center;
    padding: 36px 24px 40px; gap: 10px; animation: fadeUp 0.3s ease;
  }
  .modal-done-icon { font-size: 48px; }
  .modal-done-text { font-size: 17px; font-weight: 700; color: #111; letter-spacing: -0.03em; }
  .modal-done-sub { font-size: 13px; color: #767676; text-align: center; }
  .invite-code-box {
    display: flex; align-items: center; justify-content: space-between;
    background: #F7F7F7; border: 1.5px solid #E5E5EC; border-radius: 16px;
    padding: 16px 20px; margin-bottom: 4px; gap: 12px;
  }
  .invite-group-label { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px; }
  .invite-link-text { font-size: 12px; color: #BBBBBB; }
  .invite-code-badge {
    font-size: 15px; font-weight: 800; color: #FF2A7A;
    background: #FFE8F2; padding: 6px 12px; border-radius: 100px;
    letter-spacing: 0.1em; white-space: nowrap; flex-shrink: 0;
  }
  .modal-btn-cancel {
    width: 100%; height: 44px; display: flex; align-items: center; justify-content: center;
    background: none; color: #BBBBBB;
    font-family: 'Pretendard', sans-serif; font-size: 14px; font-weight: 600;
    border: none; cursor: pointer; margin-top: 4px;
  }
  .spinner {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
    animation: spin 0.7s linear infinite;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pigBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
`;
