"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, backfillTodayRecords } from "@/lib/supabase";
import { getProfile } from "../../onboarding/page";

interface Group { id: string; name: string; invite_code: string; }

type Status = "loading" | "ready" | "joining" | "done" | "already" | "error";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [group,  setGroup]  = useState<Group | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const profile  = getProfile();
  const nickname = profile?.nickname ?? null;

  useEffect(() => {
    if (!code) { setStatus("error"); return; }
    supabase
      .from("groups")
      .select("*")
      .eq("invite_code", code.toUpperCase())
      .single()
      .then(({ data }) => {
        if (!data) { setStatus("error"); return; }
        setGroup(data);
        setStatus("ready");
      });
  }, [code]);

  async function handleJoin() {
    if (!nickname) {
      router.replace("/onboarding");
      return;
    }
    if (!group) return;
    setStatus("joining");

    const { data: already } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("nickname", nickname)
      .single();

    if (already) {
      setStatus("already");
      setTimeout(() => router.replace(`/group/${group.id}`), 900);
      return;
    }

    await supabase.from("group_members").insert({ group_id: group.id, nickname });
    // 가입 당일 로컬에 기록된 절약 내역을 그룹에 합쳐주기
    await backfillTodayRecords(group.id, nickname);
    setStatus("done");
    setTimeout(() => router.replace(`/group/${group.id}`), 1200);
  }

  if (status === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100svh" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #F1F1F5", borderTopColor: "#FF2A7A", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="join-shell">
        <div className="join-top">
          <div className="join-pig">🐷</div>
          <h1 className="join-app">참으면돼지</h1>
          <p className="join-sub">절약 챌린지 그룹 초대</p>
        </div>

        {status === "error" ? (
          <div className="join-card join-card--error">
            <p className="join-err-icon">😢</p>
            <p className="join-err-title">링크가 유효하지 않아요</p>
            <p className="join-err-sub">초대 코드를 다시 확인해주세요</p>
            <button className="join-action-btn" onClick={() => router.replace("/friends")}>
              그룹 탭으로 가기
            </button>
          </div>
        ) : (
          <div className="join-card">
            <p className="join-label">초대된 그룹</p>
            <p className="join-group-name">{group?.name}</p>
            <p className="join-code-row">코드 <strong>{group?.invite_code}</strong></p>

            {status === "done" && (
              <div className="join-result join-result--success">🎉 참가 완료! 그룹으로 이동 중...</div>
            )}
            {status === "already" && (
              <div className="join-result join-result--success">이미 참가한 그룹이에요!</div>
            )}

            {(status === "ready" || status === "joining") && (
              <>
                {!nickname && (
                  <p className="join-no-nick">닉네임 설정 후 참가할 수 있어요</p>
                )}
                <button
                  className="join-action-btn"
                  onClick={handleJoin}
                  disabled={status === "joining"}
                >
                  {status === "joining"
                    ? <span className="join-spinner" />
                    : nickname
                      ? `${nickname}로 참가하기`
                      : "닉네임 설정하고 참가하기"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  .join-shell {
    width: 100%; max-width: 402px; min-height: 100svh; margin: 0 auto;
    background: #fff; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 28px; padding: 40px 24px;
    font-family: 'Pretendard', -apple-system, sans-serif; box-sizing: border-box;
  }
  .join-top { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .join-pig { font-size: 72px; animation: pigBounce 1.6s ease-in-out infinite; }
  .join-app { font-size: 24px; font-weight: 800; color: #111; letter-spacing: -0.04em; }
  .join-sub { font-size: 14px; color: #767676; }
  .join-card {
    width: 100%; background: #FAFAFA; border-radius: 20px;
    padding: 28px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .join-card--error { gap: 8px; }
  .join-label { font-size: 12px; font-weight: 600; color: #BBBBBB; text-transform: uppercase; letter-spacing: 0.08em; }
  .join-group-name { font-size: 26px; font-weight: 800; color: #111; letter-spacing: -0.04em; text-align: center; }
  .join-code-row { font-size: 13px; color: #767676; }
  .join-code-row strong { color: #111; font-weight: 700; letter-spacing: 0.1em; }
  .join-no-nick { font-size: 13px; color: #FF2A7A; text-align: center; }
  .join-action-btn {
    margin-top: 8px; width: 100%; height: 56px;
    background: #FF2A7A; color: #fff;
    font-family: 'Pretendard', sans-serif; font-size: 16px; font-weight: 700;
    border: none; border-radius: 16px; cursor: pointer;
    box-shadow: 0 6px 20px rgba(255,42,122,0.30);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s;
  }
  .join-action-btn:active { transform: scale(0.97); }
  .join-action-btn:disabled { background: #F1F1F5; color: #BBBBBB; box-shadow: none; cursor: not-allowed; }
  .join-result {
    width: 100%; padding: 14px; border-radius: 12px;
    font-size: 14px; font-weight: 600; text-align: center;
  }
  .join-result--success { background: #F0FFF4; color: #22C55E; }
  .join-err-icon { font-size: 48px; }
  .join-err-title { font-size: 16px; font-weight: 700; color: #111; }
  .join-err-sub { font-size: 13px; color: #767676; }
  .join-spinner {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pigBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
`;
