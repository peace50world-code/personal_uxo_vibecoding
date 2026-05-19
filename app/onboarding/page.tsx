"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

// ─── 스토리지 ─────────────────────────────────────────
export interface UserProfile {
  userId: string;
  nickname: string;
  pin: string;
  createdAt: string;
}
export const USER_KEY    = "piggy-user";
export const SESSION_KEY = "piggy-session";

function generateUserId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const d = localStorage.getItem(USER_KEY);
    if (!d) return null;
    const profile: UserProfile = JSON.parse(d);
    // 마이그레이션: userId 없으면 생성
    if (!profile.userId) {
      profile.userId = generateUserId();
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    }
    return profile;
  } catch { return null; }
}
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

type Mode  = "setup" | "login";
type Step  = "nickname" | "pin";     // setup 모드의 2단계

export default function OnboardingPage() {
  const router = useRouter();

  const [mode,        setMode]        = useState<Mode>("setup");
  const [step,        setStep]        = useState<Step>("nickname");
  const [nickname,    setNickname]    = useState("");
  const [pin,         setPin]         = useState("");
  const [profileName, setProfileName] = useState("");   // 로그인 모드용
  const [error,       setError]       = useState(false);
  const [shake,       setShake]       = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const nicknameRef = useRef<HTMLInputElement>(null);
  const pinRef      = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      // 이미 세션이 있으면 홈으로
      if (isLoggedIn()) { router.replace("/"); return; }
      // 프로필은 있지만 세션 없음 → 로그인 모드
      setMode("login");
      setProfileName(profile.nickname);
    } else {
      setMode("setup");
      setTimeout(() => nicknameRef.current?.focus(), 300);
    }
  }, [router]);

  // ── PIN 4자리 입력 시 자동 진행 ──────────────────────
  useEffect(() => {
    if (pin.length < 4) return;

    if (mode === "setup") {
      // 설정 완료 → 저장
      handleSetupSave();
    } else {
      // 로그인 검증
      handleLoginVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // ── 닉네임 → PIN 단계 이동 ─────────────────────────
  const goToPin = () => {
    if (!nickname.trim()) return;
    setStep("pin");
    setTimeout(() => pinRef.current?.focus(), 150);
  };

  // ── 설정 저장 ──────────────────────────────────────
  const handleSetupSave = async () => {
    if (pin.length < 4 || !nickname.trim()) return;
    setSubmitting(true);
    const userId = generateUserId();
    const profile: UserProfile = {
      userId,
      nickname: nickname.trim(),
      pin,
      createdAt: new Date().toISOString(),
    };
    // Supabase에 저장 (실패해도 로컬로 진행)
    const { error: insertErr } = await supabase.from("profiles").insert({
      user_id: userId,
      nickname: profile.nickname,
      pin: profile.pin,
    });
    if (insertErr) console.error(insertErr);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    sessionStorage.setItem(SESSION_KEY, "1");
    router.replace("/");
  };

  // ── 로그인 검증 ────────────────────────────────────
  const handleLoginVerify = async () => {
    const localProfile = getProfile();
    // Supabase에서 닉네임+PIN으로 조회 (크로스 디바이스 지원)
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("nickname", profileName)
      .eq("pin", pin)
      .maybeSingle();

    if (data) {
      // Supabase에서 찾음 → 로컬 캐시 갱신
      const profile: UserProfile = {
        userId: data.user_id,
        nickname: data.nickname,
        pin: data.pin,
        createdAt: data.created_at,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      setSubmitting(true);
      setTimeout(() => { sessionStorage.setItem(SESSION_KEY, "1"); router.replace("/"); }, 500);
    } else if (localProfile?.pin === pin) {
      // 오프라인 폴백: 로컬 프로필로 검증
      setSubmitting(true);
      setTimeout(() => { sessionStorage.setItem(SESSION_KEY, "1"); router.replace("/"); }, 500);
    } else {
      setError(true);
      setShake(true);
      setPin("");
      setTimeout(() => { setShake(false); setError(false); pinRef.current?.focus(); }, 600);
    }
  };

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(v);
    if (error) setError(false);
  };

  // ────────────────────────────────────────────────────
  // 로그인 모드 UI
  // ────────────────────────────────────────────────────
  if (mode === "login") {
    return (
      <>
        <style>{css}</style>
        <div className="shell">
          <div className="ob-inner">

            {/* 로고 */}
            <div className="logo-area">
              <div className="logo-pig">🐷</div>
              <h1 className="logo-title">참으면돼지</h1>
            </div>

            {/* 환영 */}
            <div className="login-welcome">
              <p className="login-greeting">
                안녕하세요, <span className="login-name">{profileName}</span>님!
              </p>
              <p className="login-hint">PIN 번호를 입력해주세요</p>
            </div>

            {/* PIN 입력 */}
            <div className="pin-section">
              <div
                className={`pin-dots ${shake ? "pin-dots--shake" : ""} ${error ? "pin-dots--error" : ""}`}
                onClick={() => pinRef.current?.focus()}
              >
                {[0,1,2,3].map(i => (
                  <div
                    key={i}
                    className={`pin-dot ${pin.length > i ? "pin-dot--filled" : ""} ${pin.length === i && !submitting ? "pin-dot--cursor" : ""}`}
                  />
                ))}
              </div>
              {error && <p className="pin-error">PIN이 올바르지 않아요</p>}
              <input
                ref={pinRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={handlePinInput}
                className="pin-hidden"
                autoComplete="off"
              />
            </div>

            {/* 로그인 버튼 */}
            <div className="ob-footer">
              <button
                className={`btn-primary ${(pin.length < 4 || submitting) ? "btn-primary--disabled" : ""}`}
                onClick={handleLoginVerify}
                disabled={pin.length < 4 || submitting}
              >
                {submitting ? <span className="spinner" /> : "로그인"}
              </button>
            </div>

          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────
  // 설정 모드 UI
  // ────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="shell">
        <div className="ob-inner">

          {/* 로고 */}
          <div className="logo-area">
            <div className={`logo-pig ${step === "pin" ? "logo-pig--small" : ""}`}>🐷</div>
            <h1 className={`logo-title ${step === "pin" ? "logo-title--small" : ""}`}>참으면돼지</h1>
            <p className={`logo-sub ${step === "pin" ? "logo-sub--hidden" : ""}`}>
              참을수록 진짜 부자 돼지가 됩니다
            </p>
          </div>

          {/* 단계 인디케이터 */}
          <div className="step-dots">
            <div className={`step-dot ${step === "nickname" ? "step-dot--active" : "step-dot--done"}`} />
            <div className={`step-dot ${step === "pin" ? "step-dot--active" : ""}`} />
          </div>

          {/* 닉네임 입력 */}
          {step === "nickname" && (
            <div className="form-section" key="nickname">
              <label className="field-label" htmlFor="nickname-input">닉네임</label>
              <div className={`field-wrap ${nickname ? "field-wrap--filled" : ""}`}>
                <input
                  id="nickname-input"
                  ref={nicknameRef}
                  className="field-input"
                  type="text"
                  placeholder="닉네임을 입력해주세요"
                  value={nickname}
                  maxLength={12}
                  onChange={e => setNickname(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") goToPin(); }}
                />
                {nickname && (
                  <button className="field-clear" onClick={() => setNickname("")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
              <p className="field-hint">그룹에서 친구들에게 보여지는 이름이에요</p>
            </div>
          )}

          {/* PIN 입력 */}
          {step === "pin" && (
            <div className="form-section" key="pin">
              <label className="field-label">PIN 번호 (4자리)</label>
              <div
                className="pin-dots"
                onClick={() => pinRef.current?.focus()}
              >
                {[0,1,2,3].map(i => (
                  <div
                    key={i}
                    className={`pin-dot ${pin.length > i ? "pin-dot--filled" : ""} ${pin.length === i && !submitting ? "pin-dot--cursor" : ""}`}
                  />
                ))}
              </div>
              <p className="field-hint">앱에 접속할 때 사용하는 숫자 4자리예요</p>
              <input
                ref={pinRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={handlePinInput}
                className="pin-hidden"
                autoComplete="new-password"
              />
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="ob-footer">
            {step === "nickname" ? (
              <button
                className={`btn-primary ${!nickname.trim() ? "btn-primary--disabled" : ""}`}
                onClick={goToPin}
                disabled={!nickname.trim()}
              >
                다음
              </button>
            ) : (
              <>
                <button
                  className={`btn-primary ${(pin.length < 4 || submitting) ? "btn-primary--disabled" : ""}`}
                  onClick={handleSetupSave}
                  disabled={pin.length < 4 || submitting}
                >
                  {submitting ? <span className="spinner" /> : "시작하기 🐷"}
                </button>
                <button className="btn-back" onClick={() => { setPin(""); setStep("nickname"); }}>
                  이전으로
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ─── 스타일 ─────────────────────────────────────────
const css = `
  /* ── 기본 셸 ── */
  .shell {
    width: 100%;
    max-width: 402px;
    height: 100svh;
    margin: 0 auto;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
  }
  .ob-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 28px;
    padding-bottom: max(40px, env(safe-area-inset-bottom));
    overflow-y: auto;
    scrollbar-width: none;
  }
  .ob-inner::-webkit-scrollbar { display: none; }

  /* ── 로고 영역 ── */
  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 80px;
    padding-bottom: 16px;
    gap: 8px;
    transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .logo-pig {
    font-size: 64px;
    line-height: 1;
    animation: pigFloat 3s ease-in-out infinite;
    transition: font-size 0.3s ease;
    filter: drop-shadow(0 8px 20px rgba(255,42,122,0.15));
  }
  .logo-pig--small { font-size: 44px; }
  .logo-title {
    font-size: 28px;
    font-weight: 900;
    color: #111111;
    letter-spacing: -0.05em;
    transition: font-size 0.3s ease;
    margin: 0;
  }
  .logo-title--small { font-size: 22px; }
  .logo-sub {
    font-size: 14px;
    color: #767676;
    letter-spacing: -0.02em;
    transition: opacity 0.3s ease, max-height 0.3s ease;
    max-height: 40px;
    overflow: hidden;
    margin: 0;
  }
  .logo-sub--hidden { opacity: 0; max-height: 0; }

  /* ── 단계 인디케이터 ── */
  .step-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin: 16px 0 32px;
  }
  .step-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #E5E5EC;
    transition: all 0.3s ease;
  }
  .step-dot--active {
    width: 20px;
    border-radius: 3px;
    background: #111111;
  }
  .step-dot--done { background: #111111; }

  /* ── 환영 텍스트 (로그인 모드) ── */
  .login-welcome {
    margin-top: 8px;
    margin-bottom: 40px;
    text-align: center;
  }
  .login-greeting {
    font-size: 20px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.03em;
    margin: 0 0 8px;
  }
  .login-name { color: #FF2A7A; }
  .login-hint {
    font-size: 14px;
    color: #767676;
    margin: 0;
  }

  /* ── 폼 섹션 ── */
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: fadeSlide 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    flex: 1;
  }
  .field-label {
    font-size: 14px;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.02em;
  }
  .field-wrap {
    display: flex;
    align-items: center;
    height: 58px;
    padding: 0 18px;
    background: #F7F7F7;
    border: 1.5px solid transparent;
    border-radius: 18px;
    transition: all 0.2s;
  }
  .field-wrap:focus-within {
    background: #FFFFFF;
    border-color: #111111;
    box-shadow: 0 0 0 3px rgba(17,17,17,0.07);
  }
  .field-wrap--filled {
    background: #FFFFFF;
    border-color: #E5E5EC;
  }
  .field-input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Pretendard', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #111111;
    letter-spacing: -0.01em;
  }
  .field-input::placeholder { color: #BBBBBB; font-weight: 400; }
  .field-clear {
    background: none;
    border: none;
    cursor: pointer;
    color: #BBBBBB;
    display: flex;
    align-items: center;
    padding: 4px;
    -webkit-tap-highlight-color: transparent;
  }
  .field-clear:hover { color: #767676; }
  .field-hint {
    font-size: 12px;
    color: #BBBBBB;
    letter-spacing: -0.01em;
    margin: 0;
    padding-left: 4px;
  }

  /* ── PIN 도트 ── */
  .pin-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    flex: 1;
    padding-top: 8px;
  }
  .pin-dots {
    display: flex;
    gap: 16px;
    cursor: pointer;
    padding: 16px;
    justify-content: center;
  }
  .pin-dots--shake { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
  .pin-dots--error .pin-dot--filled { background: #FF4444 !important; border-color: #FF4444 !important; }

  .pin-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #D0D0D8;
    background: transparent;
    transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
  }
  .pin-dot--filled {
    background: #111111;
    border-color: #111111;
    transform: scale(1.08);
  }
  .pin-dot--cursor::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 10px;
    background: #111111;
    border-radius: 1px;
    animation: blink 1s step-end infinite;
  }

  .pin-error {
    font-size: 13px;
    font-weight: 600;
    color: #FF4444;
    margin: 0;
    animation: fadeUp 0.2s ease;
  }
  .pin-hidden {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;
  }

  /* ── 하단 버튼 영역 ── */
  .ob-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 32px;
    margin-top: auto;
  }
  .btn-primary {
    width: 100%;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111111;
    color: #FFFFFF;
    font-family: 'Pretendard', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    border: none;
    border-radius: 18px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .btn-primary:not(:disabled):active { transform: scale(0.97); }
  .btn-primary--disabled {
    background: #F1F1F5;
    color: #BBBBBB;
    cursor: not-allowed;
    transform: none !important;
  }
  .btn-back {
    width: 100%;
    height: 44px;
    background: none;
    border: none;
    font-family: 'Pretendard', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #767676;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.15s;
  }
  .btn-back:hover { color: #111111; }

  /* ── 스피너 ── */
  .spinner {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    animation: spin 0.7s linear infinite;
  }

  /* ── 키프레임 ── */
  @keyframes pigFloat {
    0%, 100% { transform: translateY(0) rotate(-3deg); }
    50%       { transform: translateY(-10px) rotate(3deg); }
  }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60%  { transform: translateX(-10px); }
    40%, 80%  { transform: translateX(10px); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
