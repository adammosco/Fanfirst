import { useState, useEffect, useRef } from "react";
import {
  SignedIn, SignedOut, useClerk, useUser, SignIn, SignUp,
} from "@clerk/clerk-react";

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_CONCERTS = [
  { id: 1, artist: "Hozier", venue: "O2 Arena, London", date: "Sat 14 Sep 2026", time: "19:30", price: "£65", img: "🎸", tier1Opens: "31 Aug", tier2Opens: "7 Sep", publicOpens: "11 Sep", totalTickets: 2000, remaining: 843 },
  { id: 2, artist: "Billie Eilish", venue: "Manchester AO Arena", date: "Fri 3 Oct 2026", time: "20:00", price: "£72", img: "🎤", tier1Opens: "19 Sep", tier2Opens: "26 Sep", publicOpens: "30 Sep", totalTickets: 1500, remaining: 210 },
  { id: 3, artist: "Kendrick Lamar", venue: "Wembley Stadium, London", date: "Sat 18 Oct 2026", time: "18:00", price: "£89", img: "🎧", tier1Opens: "4 Oct", tier2Opens: "11 Oct", publicOpens: "15 Oct", totalTickets: 5000, remaining: 3201 },
];

const ONBOARDING_SLIDES = [
  { emoji: "🎟", title: "Tickets for real fans.", body: "FanFirst uses your Fan Score to give the biggest fans priority access — before the bots even wake up.", accent: "#E8C547" },
  { emoji: "⭐", title: "Your loyalty earns access.", body: "Your streaming history, past attendance, and merch purchases all count toward your Fan Score.", accent: "#C4A0FF" },
  { emoji: "🔒", title: "Scalpers can't win here.", body: "Named tickets, ID checks, and face-value-only resale make FanFirst a scalper-free zone.", accent: "#7EC8E3" },
];

// ── Shared UI ──────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80, animated = false }) {
  const [display, setDisplay] = useState(animated ? 0 : score);
  useEffect(() => {
    if (!animated) return;
    let v = 0;
    const step = () => { v += 2; if (v >= score) { setDisplay(score); return; } setDisplay(v); requestAnimationFrame(step); };
    const t = setTimeout(() => requestAnimationFrame(step), 400);
    return () => clearTimeout(t);
  }, [score, animated]);
  const r = size / 2 - 8, circ = 2 * Math.PI * r, dash = (display / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2A2A3E" strokeWidth="7" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8C547" strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.05s linear" }} />
    </svg>
  );
}

function TierBadge({ tier }) {
  const c = { 1: "#E8C547", 2: "#C4A0FF", 3: "#7EC8E3" };
  const l = { 1: "Tier 1 — Top Fan", 2: "Tier 2 — Loyal Fan", 3: "Tier 3 — Verified" };
  return <span style={{ background: c[tier]+"22", border: `1px solid ${c[tier]}`, color: c[tier], borderRadius: 99, padding: "3px 12px", fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>{l[tier]}</span>;
}

function ProgressBar({ value, color = "#E8C547", label }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#9090A0", fontSize: 12 }}>{label}</span>
        <span style={{ color: "#F0EDE8", fontSize: 12, fontWeight: 600 }}>{value}pts</span>
      </div>
      <div style={{ background: "#2A2A3E", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${(value/40)*100}%`, background: color, height: "100%", borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 99, background: value ? "#E8C547" : "#2A2A3E", position: "relative", cursor: "pointer", transition: "background 0.2s ease", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: 99, background: value ? "#0A0A0F" : "#606080", transition: "left 0.2s ease" }} />
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ user, localPhoto, size = 40, onClick, showEdit = false }) {
  const initials = user?.firstName?.[0] && user?.lastName?.[0]
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U";
  const imgSrc = localPhoto || user?.imageUrl;
  return (
    <button onClick={onClick} style={{ width: size, height: size, borderRadius: 99, background: "#E8C54722", border: "2px solid #E8C547", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.35, color: "#E8C547", cursor: "pointer", padding: 0, overflow: "hidden", flexShrink: 0, position: "relative" }}>
      {imgSrc ? <img src={imgSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
      {showEdit && (
        <div style={{ position: "absolute", inset: 0, background: "#0A0A0F88", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, opacity: 0, transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0"}>📷</div>
      )}
    </button>
  );
}

// ── Concert Card ───────────────────────────────────────────────────────────────
function ConcertCard({ concert, userTier, onBuy }) {
  const unlocked = userTier <= 2;
  const soldPct = Math.round(((concert.totalTickets - concert.remaining) / concert.totalTickets) * 100);
  return (
    <div style={{ background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 16, padding: 20, marginBottom: 16, transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#E8C54766"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#2A2A3E"}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ fontSize: 36, background: "#2A2A3E", borderRadius: 12, width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{concert.img}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0, color: "#F0EDE8", fontSize: 18, fontWeight: 700 }}>{concert.artist}</h3>
            <span style={{ color: "#E8C547", fontWeight: 700, fontSize: 16 }}>{concert.price}</span>
          </div>
          <p style={{ margin: "4px 0 0", color: "#7070A0", fontSize: 13 }}>📍 {concert.venue}</p>
          <p style={{ margin: "2px 0 0", color: "#7070A0", fontSize: 13 }}>📅 {concert.date} · {concert.time}</p>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#9090A0", fontSize: 11 }}>Tickets sold</span>
              <span style={{ color: soldPct > 80 ? "#FF6B6B" : "#7070A0", fontSize: 11 }}>{concert.remaining} left</span>
            </div>
            <div style={{ background: "#0A0A0F", borderRadius: 99, height: 4 }}>
              <div style={{ width: `${soldPct}%`, height: "100%", borderRadius: 99, background: soldPct > 80 ? "#FF6B6B" : "#E8C547" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {[{ label: "Tier 1", date: concert.tier1Opens, color: "#E8C547" }, { label: "Tier 2", date: concert.tier2Opens, color: "#C4A0FF" }, { label: "Public", date: concert.publicOpens, color: "#7EC8E3" }].map(w => (
              <div key={w.label} style={{ background: w.color+"15", border: `1px solid ${w.color}44`, borderRadius: 8, padding: "4px 8px", fontSize: 11 }}>
                <span style={{ color: w.color, fontWeight: 700 }}>{w.label}</span>
                <span style={{ color: "#9090A0", marginLeft: 4 }}>{w.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => onBuy(concert)} style={{ marginTop: 16, width: "100%", background: unlocked ? "#E8C547" : "#2A2A3E", color: unlocked ? "#0A0A0F" : "#606080", border: unlocked ? "none" : "1px solid #3A3A5E", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: unlocked ? "pointer" : "not-allowed", letterSpacing: 0.3, transition: "opacity 0.2s" }}
        onMouseEnter={e => unlocked && (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        {unlocked ? "🎟 Get Early Access" : "🔒 Build Fan Score to Unlock"}
      </button>
    </div>
  );
}

// ── Splash ─────────────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setVis(true); const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0A0A0F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1000, opacity: vis ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <div style={{ fontSize: 56, transform: vis ? "scale(1)" : "scale(0.7)", transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)", marginBottom: 16 }}>🎟</div>
      <div style={{ fontSize: 10, color: "#E8C547", letterSpacing: 4, fontWeight: 700, textTransform: "uppercase", opacity: vis ? 1 : 0, transition: "opacity 0.6s ease 0.3s" }}>✦ FanFirst</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#F0EDE8", margin: "8px 0 0", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: "all 0.6s ease 0.4s" }}>Ticketing</h1>
      <p style={{ color: "#7070A0", fontSize: 13, marginTop: 8, opacity: vis ? 1 : 0, transition: "opacity 0.6s ease 0.6s" }}>Built for fans. Not bots.</p>
    </div>
  );
}

// ── Onboarding ─────────────────────────────────────────────────────────────────
function OnboardingScreen({ onDone }) {
  const [slide, setSlide] = useState(0);
  const cur = ONBOARDING_SLIDES[slide];
  const isLast = slide === ONBOARDING_SLIDES.length - 1;
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "60px 32px 48px", fontFamily: "'Inter',sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onDone} style={{ background: "none", border: "none", color: "#606080", fontSize: 14, cursor: "pointer" }}>Skip</button>
      </div>
      <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 24, filter: `drop-shadow(0 0 24px ${cur.accent}66)`, transition: "all 0.3s ease" }}>{cur.emoji}</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#F0EDE8", margin: "0 0 16px", lineHeight: 1.2 }}>{cur.title}</h2>
        <p style={{ fontSize: 15, color: "#9090A0", lineHeight: 1.7, margin: 0 }}>{cur.body}</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {ONBOARDING_SLIDES.map((_, i) => (
          <div key={i} style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 99, background: i === slide ? cur.accent : "#2A2A3E", transition: "all 0.3s ease" }} />
        ))}
      </div>
      <button onClick={() => isLast ? onDone() : setSlide(s => s + 1)} style={{ width: "100%", background: cur.accent, border: "none", borderRadius: 14, padding: "16px 0", fontWeight: 800, fontSize: 16, color: "#0A0A0F", cursor: "pointer", transition: "background 0.3s ease" }}>
        {isLast ? "Get Started →" : "Next →"}
      </button>
    </div>
  );
}

// ── Auth ───────────────────────────────────────────────────────────────────────
function AuthScreen({ mode, setMode }) {
  const appearance = { variables: { colorPrimary: "#E8C547", colorBackground: "#1A1A2E", colorText: "#F0EDE8", colorTextSecondary: "#9090A0", colorInputBackground: "#0A0A0F", colorInputText: "#F0EDE8", borderRadius: "12px" } };
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎟</div>
        <div style={{ fontSize: 10, color: "#E8C547", letterSpacing: 4, fontWeight: 700, textTransform: "uppercase" }}>✦ FanFirst Ticketing</div>
        <p style={{ color: "#7070A0", fontSize: 13, margin: "8px 0 0" }}>{mode === "sign-in" ? "Welcome back." : "Join the fan-first movement."}</p>
      </div>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {mode === "sign-in" ? <SignIn appearance={appearance} routing="hash" /> : <SignUp appearance={appearance} routing="hash" />}
      </div>
      <p style={{ color: "#7070A0", fontSize: 13, marginTop: 20 }}>
        {mode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} style={{ background: "none", border: "none", color: "#E8C547", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
          {mode === "sign-in" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

// ── Profile / Settings Drawer ──────────────────────────────────────────────────
function ProfileMenu({ open, onClose, user, localPhoto, onPhotoChange, onSignOut }) {
  const fileRef = useRef();
  const [spotifyLinked,  setSpotifyLinked]  = useState(false);
  const [appleLinked,    setAppleLinked]    = useState(false);
  const [notifications,  setNotifications]  = useState(true);
  const [emailAlerts,    setEmailAlerts]    = useState(true);
  const [earlyAccess,    setEarlyAccess]    = useState(true);
  const [darkMode,       setDarkMode]       = useState(true);
  const [activeSection,  setActiveSection]  = useState(null);

  const name  = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.emailAddresses?.[0]?.emailAddress ?? "Fan";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  function Section({ id, title, children }) {
    return (
      <div style={{ marginBottom: 2 }}>
        <div style={{ fontSize: 10, color: "#606080", letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", padding: "14px 20px 6px" }}>{title}</div>
        <div style={{ borderTop: "1px solid #1E1E30", borderBottom: "1px solid #1E1E30" }}>{children}</div>
      </div>
    );
  }

  function Row({ icon, label, sublabel, right, onClick, danger, tag }) {
    return (
      <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: "1px solid #1A1A2A", cursor: onClick ? "pointer" : "default", transition: "background 0.15s" }}
        onMouseEnter={e => onClick && (e.currentTarget.style.background = "#1E1E2E")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? "#FF6B6B22" : "#2A2A3E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, color: danger ? "#FF6B6B" : "#F0EDE8", fontWeight: 500 }}>{label}</span>
            {tag && <span style={{ fontSize: 10, background: "#E8C54722", color: "#E8C547", border: "1px solid #E8C54744", borderRadius: 99, padding: "1px 7px", fontWeight: 700 }}>{tag}</span>}
          </div>
          {sublabel && <div style={{ fontSize: 11, color: "#606080", marginTop: 1 }}>{sublabel}</div>}
        </div>
        {right || (onClick && !danger && <span style={{ color: "#3A3A5E", fontSize: 18 }}>›</span>)}
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#0A0A0FAA", zIndex: 200, opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none", transition: "opacity 0.25s ease", backdropFilter: "blur(6px)" }} />

      {/* Drawer — slides in from right */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "88%", maxWidth: 360, background: "#0D0D1A", zIndex: 201, transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(160deg,#1A1A2E 0%,#200A30 100%)", padding: "52px 20px 24px", position: "relative", flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#2A2A3E", border: "none", color: "#9090A0", borderRadius: 99, width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

          {/* Avatar + upload */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
            <div style={{ width: 76, height: 76, borderRadius: 99, border: "3px solid #E8C547", overflow: "hidden", background: "#E8C54722", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#E8C547" }}>
              {(localPhoto || user?.imageUrl)
                ? <img src={localPhoto || user?.imageUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user?.firstName?.[0] ?? "U")}
            </div>
            {/* Camera badge */}
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, background: "#E8C547", border: "2px solid #0D0D1A", borderRadius: 99, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer" }}>📷</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (!f) return; onPhotoChange(URL.createObjectURL(f)); }} />
          </div>

          <div style={{ fontSize: 19, fontWeight: 800, color: "#F0EDE8" }}>{name}</div>
          <div style={{ fontSize: 12, color: "#7070A0", marginTop: 2, marginBottom: 10 }}>{email}</div>
          <TierBadge tier={2} />
        </div>

        {/* ── Fan Score mini banner ── */}
        <div style={{ margin: "12px 16px", background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ScoreRing score={78} size={52} animated />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#E8C547" }}>78</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F0EDE8" }}>Fan Score</div>
            <div style={{ fontSize: 11, color: "#7070A0", marginTop: 2 }}>Link Spotify to earn <span style={{ color: "#E8C547" }}>+18 pts</span></div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 18, color: "#3A3A5E" }}>›</div>
        </div>

        {/* ── Menu sections ── */}
        <div style={{ flex: 1, paddingBottom: 40 }}>

          <Section title="Account">
            <Row icon="👤" label="Edit Profile" sublabel="Name, bio, location" onClick={() => {}} />
            <Row icon="🔒" label="Change Password" onClick={() => {}} />
            <Row icon="📧" label="Email Preferences" sublabel={email} onClick={() => {}} />
            <Row icon="🪪" label="Verify Identity" sublabel="Required for ticket purchases" tag="Required" onClick={() => {}} />
          </Section>

          <Section title="Connect Music">
            <Row icon="🟢" label="Spotify"
              sublabel={spotifyLinked ? "Connected · boosts streaming score" : "Not connected"}
              right={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {spotifyLinked && <span style={{ fontSize: 10, color: "#4CAF50", fontWeight: 700 }}>ON</span>}
                  <Toggle value={spotifyLinked} onChange={setSpotifyLinked} />
                </div>
              }
            />
            <Row icon="🎵" label="Apple Music"
              sublabel={appleLinked ? "Connected" : "Not connected"}
              right={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {appleLinked && <span style={{ fontSize: 10, color: "#4CAF50", fontWeight: 700 }}>ON</span>}
                  <Toggle value={appleLinked} onChange={setAppleLinked} />
                </div>
              }
            />
            <Row icon="⭐" label="Fan Score Breakdown" sublabel="See how your score is calculated" onClick={() => {}} />
          </Section>

          <Section title="Notifications">
            <Row icon="🔔" label="Push Notifications" right={<Toggle value={notifications} onChange={setNotifications} />} />
            <Row icon="📩" label="Email Alerts" right={<Toggle value={emailAlerts} onChange={setEmailAlerts} />} />
            <Row icon="🎟" label="Early Access Alerts" sublabel="Get notified when your window opens" right={<Toggle value={earlyAccess} onChange={setEarlyAccess} />} />
          </Section>

          <Section title="Tickets & Payments">
            <Row icon="🎟" label="My Tickets" sublabel="View and manage your tickets" onClick={() => {}} />
            <Row icon="💳" label="Payment Methods" sublabel="Add or remove cards" onClick={() => {}} />
            <Row icon="📋" label="Purchase History" onClick={() => {}} />
            <Row icon="🔁" label="Resale Requests" sublabel="Request face-value transfers" onClick={() => {}} />
            <Row icon="⏳" label="Waitlists" sublabel="You're on 1 active waitlist" onClick={() => {}} />
          </Section>

          <Section title="Preferences">
            <Row icon="🌙" label="Dark Mode" right={<Toggle value={darkMode} onChange={setDarkMode} />} />
            <Row icon="🌍" label="Region & Currency" sublabel="UK · GBP £" onClick={() => {}} />
            <Row icon="♿" label="Accessibility" onClick={() => {}} />
          </Section>

          <Section title="Support">
            <Row icon="❓" label="Help Centre" onClick={() => {}} />
            <Row icon="💬" label="Contact Support" sublabel="Usually replies within 2 hours" onClick={() => {}} />
            <Row icon="🐛" label="Report a Bug" onClick={() => {}} />
            <Row icon="📜" label="Terms & Privacy Policy" onClick={() => {}} />
            <Row icon="⭐" label="Rate FanFirst" onClick={() => {}} />
          </Section>

          <Section title="">
            <Row icon="🚪" label="Sign Out" danger onClick={onSignOut} />
          </Section>

          <p style={{ textAlign: "center", color: "#2A2A3E", fontSize: 11, margin: "20px 0 0", letterSpacing: 0.5 }}>
            FanFirst v1.0.0 · Built for fans, not bots ✦
          </p>
        </div>
      </div>
    </>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
function MainApp() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [tab,         setTab]         = useState("discover");
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [localPhoto,  setLocalPhoto]  = useState(null);
  const [buying,      setBuying]      = useState(null);
  const [purchased,   setPurchased]   = useState(false);
  const [ticketCount, setTicketCount] = useState(1);

  const fanScore = 78;
  const userTier = 2;
  const myTickets = [
    { artist: "Hozier", venue: "O2 Arena, London", date: "Sat 14 Sep 2026", seat: "Block B, Row 4" },
  ];
  const tabs = [
    { id: "discover", label: "Discover", icon: "🎵" },
    { id: "profile",  label: "Profile",  icon: "👤" },
    { id: "tickets",  label: "Tickets",  icon: "🎟" },
  ];

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#0A0A0F", minHeight: "100vh", color: "#F0EDE8", maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: "#1A1A2E", borderBottom: "1px solid #2A2A3E", padding: "18px 20px 14px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: "#E8C547", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>✦ FanFirst Ticketing</div>
            <h1 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#F0EDE8" }}>
              {tab === "discover" && "Upcoming Shows"}
              {tab === "profile"  && "Fan Profile"}
              {tab === "tickets"  && "My Tickets"}
            </h1>
          </div>

          {/* Profile picture — tapping opens drawer */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(true)} style={{ width: 40, height: 40, borderRadius: 99, border: "2px solid #E8C547", background: "#E8C54722", overflow: "hidden", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#E8C547" }}>
              {(localPhoto || user?.imageUrl)
                ? <img src={localPhoto || user?.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U")}
            </button>
            {/* Online dot */}
            <div style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, background: "#4CAF50", borderRadius: 99, border: "2px solid #0A0A0F" }} />
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: "20px 16px" }}>

        {/* DISCOVER */}
        {tab === "discover" && (
          <>
            <div style={{ background: "linear-gradient(135deg,#1A1A2E 0%,#2A1A3E 100%)", border: "1px solid #3A2A5E", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ScoreRing score={fanScore} size={64} animated />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#E8C547" }}>{fanScore}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9090A0", marginBottom: 4 }}>Hey {user?.firstName ?? "there"} 👋</div>
                <TierBadge tier={userTier} />
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#7070A0" }}>Early access opens <strong style={{ color: "#C4A0FF" }}>7 days</strong> before public sale</p>
              </div>
            </div>
            <h2 style={{ fontSize: 13, color: "#9090A0", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 12px", fontWeight: 600 }}>Available to you now</h2>
            {MOCK_CONCERTS.map(c => (
              <ConcertCard key={c.id} concert={c} userTier={userTier} onBuy={concert => { setBuying(concert); setPurchased(false); setTicketCount(1); }} />
            ))}
          </>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <>
            <div style={{ background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 16, padding: 20, marginBottom: 16, textAlign: "center" }}>
              {/* Tappable avatar on profile tab */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 4 }}>
                <button onClick={() => setMenuOpen(true)} style={{ width: 90, height: 90, borderRadius: 99, border: "3px solid #E8C547", background: "#E8C54722", overflow: "hidden", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#E8C547" }}>
                  {(localPhoto || user?.imageUrl)
                    ? <img src={localPhoto || user?.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (user?.firstName?.[0] ?? "U")}
                </button>
                <div style={{ position: "absolute", bottom: 2, right: 2, background: "#E8C547", borderRadius: 99, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, border: "2px solid #0A0A0F", cursor: "pointer" }} onClick={() => setMenuOpen(true)}>⚙️</div>
              </div>
              <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
                <ScoreRing score={fanScore} size={100} animated />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: "#E8C547" }}>{fanScore}</span>
                  <span style={{ fontSize: 10, color: "#9090A0" }}>/ 100</span>
                </div>
              </div>
              <h2 style={{ margin: "12px 0 4px", color: "#F0EDE8" }}>
                {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.emailAddresses?.[0]?.emailAddress}
              </h2>
              <TierBadge tier={userTier} />
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#4CAF50" }}>✓ Identity Verified</p>
            </div>

            <div style={{ background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 16px", color: "#F0EDE8", fontSize: 15 }}>Score Breakdown</h3>
              <ProgressBar value={32} label="🎵 Streaming history" color="#E8C547" />
              <ProgressBar value={20} label="🎪 Past attendance"   color="#C4A0FF" />
              <ProgressBar value={14} label="👕 Merch purchases"   color="#7EC8E3" />
              <ProgressBar value={12} label="📱 Social engagement" color="#FF9F7F" />
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#0A0A0F", borderRadius: 10, fontSize: 12, color: "#7070A0" }}>
                💡 Link Spotify in <strong style={{ color: "#E8C547", cursor: "pointer" }} onClick={() => setMenuOpen(true)}>Settings</strong> to boost your score by up to <strong style={{ color: "#E8C547" }}>+18 pts</strong>
              </div>
            </div>

            <button onClick={() => setMenuOpen(true)} style={{ width: "100%", background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 12, padding: "13px 0", color: "#F0EDE8", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
              ⚙️ Account Settings
            </button>
          </>
        )}

        {/* TICKETS */}
        {tab === "tickets" && (
          <>
            {myTickets.map((t, i) => (
              <div key={i} style={{ background: "linear-gradient(135deg,#1A1A2E 0%,#1A2A1E 100%)", border: "1px solid #2A4A2E", borderRadius: 16, padding: 20, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: "#F0EDE8" }}>{t.artist}</h3>
                    <p style={{ margin: "4px 0 0", color: "#7070A0", fontSize: 13 }}>📍 {t.venue}</p>
                    <p style={{ margin: "2px 0 0", color: "#7070A0", fontSize: 13 }}>📅 {t.date}</p>
                    <p style={{ margin: "2px 0 0", color: "#C4A0FF", fontSize: 13, fontWeight: 600 }}>🪑 {t.seat}</p>
                  </div>
                  <span style={{ background: "#4CAF5022", border: "1px solid #4CAF5066", color: "#4CAF50", borderRadius: 99, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>✓ Confirmed</span>
                </div>
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#0A0A0F", borderRadius: 10, fontSize: 11, color: "#9090A0", lineHeight: 1.6 }}>
                  🔒 Ticket issued 48hrs before show · Named ticket — ID required at door
                </div>
                <button style={{ marginTop: 12, width: "100%", background: "transparent", border: "1px solid #3A3A5E", borderRadius: 10, padding: "9px 0", color: "#9090A0", fontSize: 13, cursor: "pointer" }}>
                  Request Transfer →
                </button>
              </div>
            ))}
            <div style={{ background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 16, padding: 16 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#F0EDE8" }}>Waitlisted</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#7070A0" }}>You're on the waitlist for <strong style={{ color: "#C4A0FF" }}>Billie Eilish</strong> — position #47.</p>
            </div>
          </>
        )}
      </div>

      {/* Profile / Settings Drawer */}
      <ProfileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        localPhoto={localPhoto}
        onPhotoChange={setLocalPhoto}
        onSignOut={() => { setMenuOpen(false); signOut(); }}
      />

      {/* Buy Modal */}
      {buying && (
        <div style={{ position: "fixed", inset: 0, background: "#0A0A0F99", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setBuying(null)}>
          <div style={{ background: "#1A1A2E", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", border: "1px solid #2A2A3E" }}>
            {!purchased ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{buying.artist}</h2>
                    <p style={{ margin: "4px 0 0", color: "#7070A0", fontSize: 13 }}>{buying.venue} · {buying.date}</p>
                  </div>
                  <button onClick={() => setBuying(null)} style={{ background: "#2A2A3E", border: "none", color: "#F0EDE8", borderRadius: 99, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
                <TierBadge tier={userTier} />
                <p style={{ color: "#7070A0", fontSize: 13, marginTop: 10 }}>Max 2 tickets per verified identity.</p>
                <div style={{ background: "#0A0A0F", borderRadius: 12, padding: 16, margin: "16px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#9090A0", fontSize: 13 }}>Ticket price</span><span>{buying.price}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#9090A0", fontSize: 13 }}>Quantity</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={() => setTicketCount(Math.max(1, ticketCount - 1))} style={{ background: "#2A2A3E", border: "none", color: "#F0EDE8", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16 }}>−</button>
                      <span style={{ fontWeight: 700 }}>{ticketCount}</span>
                      <button onClick={() => setTicketCount(Math.min(2, ticketCount + 1))} style={{ background: "#2A2A3E", border: "none", color: "#F0EDE8", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16 }}>+</button>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #2A2A3E", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 700, color: "#E8C547" }}>£{parseInt(buying.price.replace("£","")) * ticketCount}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#606080", marginBottom: 16, lineHeight: 1.6 }}>🔒 Named & non-transferable · ID checked at door · Issued 48hrs before show</div>
                <button onClick={() => setPurchased(true)} style={{ width: "100%", background: "#E8C547", border: "none", borderRadius: 12, padding: "14px 0", fontWeight: 800, fontSize: 15, color: "#0A0A0F", cursor: "pointer" }}>
                  Confirm Purchase — £{parseInt(buying.price.replace("£","")) * ticketCount}
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
                <h2 style={{ color: "#E8C547", margin: "0 0 8px" }}>You're going!</h2>
                <p style={{ color: "#7070A0", fontSize: 14 }}>{ticketCount} × {buying.artist} ticket{ticketCount > 1 ? "s" : ""} confirmed. Named ticket arrives 48hrs before the show.</p>
                <button onClick={() => { setBuying(null); setTab("tickets"); }} style={{ marginTop: 20, background: "#E8C547", border: "none", borderRadius: 12, padding: "12px 32px", fontWeight: 700, fontSize: 14, color: "#0A0A0F", cursor: "pointer" }}>
                  View My Tickets →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#1A1A2E", borderTop: "1px solid #2A2A3E", display: "flex", padding: "10px 0 20px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: tab === t.id ? "#E8C547" : "#6060A0", letterSpacing: 0.3 }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 20, height: 2, background: "#E8C547", borderRadius: 99 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase,    setPhase]    = useState("splash");
  const [authMode, setAuthMode] = useState("sign-in");
  return (
    <>
      <SignedOut>
        {phase === "splash"     && <SplashScreen     onDone={() => setPhase("onboarding")} />}
        {phase === "onboarding" && <OnboardingScreen onDone={() => setPhase("auth")} />}
        {phase === "auth"       && <AuthScreen mode={authMode} setMode={setAuthMode} />}
      </SignedOut>
      <SignedIn>
        <MainApp />
      </SignedIn>
    </>
  );
}
