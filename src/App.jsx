
import { useState, useEffect, useRef } from "react";
import {
  SignedIn, SignedOut, useClerk, useUser, SignIn, SignUp,
} from "@clerk/clerk-react";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#0A0A0F",
  surface:  "#111118",
  card:     "#16161F",
  border:   "#1F1F2E",
  borderHi: "#2A2A3E",
  gold:     "#E8C547",
  violet:   "#A78BFA",
  teal:     "#5EEAD4",
  text:     "#F1F0F5",
  muted:    "#6B6B85",
  subtle:   "#3A3A52",
};

// ── Artist Data (Unsplash concert imagery, royalty-free) ──────────────────────
const CONCERTS = [
  {
    id: 1,
    artist: "Hozier",
    venue: "O2 Arena, London",
    date: "Sat 14 Sep 2026",
    time: "19:30",
    price: 65,
    genre: "Folk · Soul",
    img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    accent: "#8B5E3C",
    tier1Opens: "31 Aug", tier2Opens: "7 Sep", publicOpens: "11 Sep",
    totalTickets: 2000, remaining: 843,
  },
  {
    id: 2,
    artist: "Billie Eilish",
    venue: "Manchester AO Arena",
    date: "Fri 3 Oct 2026",
    time: "20:00",
    price: 72,
    genre: "Pop · Alternative",
    img: "https://images.unsplash.com/photo-1501386761578-eaa54b02df9f?w=800&q=80",
    accent: "#1A6B4A",
    tier1Opens: "19 Sep", tier2Opens: "26 Sep", publicOpens: "30 Sep",
    totalTickets: 1500, remaining: 210,
  },
  {
    id: 3,
    artist: "Kendrick Lamar",
    venue: "Wembley Stadium, London",
    date: "Sat 18 Oct 2026",
    time: "18:00",
    price: 89,
    genre: "Hip-Hop · Rap",
    img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
    accent: "#6B3A8B",
    tier1Opens: "4 Oct", tier2Opens: "11 Oct", publicOpens: "15 Oct",
    totalTickets: 5000, remaining: 3201,
  },
];

const ONBOARDING = [
  { title: "Tickets for real fans.", body: "Your Fan Score gives you priority access — before bots even wake up.", accent: T.gold, bg: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80" },
  { title: "Loyalty earns access.", body: "Streaming history, past attendance, and merch all count toward your score.", accent: T.violet, bg: "https://images.unsplash.com/photo-1501386761578-eaa54b02df9f?w=800&q=80" },
  { title: "Scalpers can't win.", body: "Named tickets, ID checks, and face-value-only resale. Full stop.", accent: T.teal, bg: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80" },
];

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo({ size = 28 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      {/* Custom F mark */}
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="9" fill={T.gold} />
        <path d="M9 8h14v3.5H13v4h9v3.5h-9V24H9V8z" fill="#0A0A0F" />
      </svg>
      <span style={{ fontSize: size * 0.75, fontWeight: 800, color: T.text, letterSpacing: -0.5, fontFamily: "'Inter',sans-serif" }}>
        Fan<span style={{ color: T.gold }}>First</span>
      </span>
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80, animated = false }) {
  const [d, setD] = useState(animated ? 0 : score);
  useEffect(() => {
    if (!animated) return;
    let v = 0;
    const go = () => { v += 2; if (v >= score) { setD(score); return; } setD(v); requestAnimationFrame(go); };
    const t = setTimeout(() => requestAnimationFrame(go), 500);
    return () => clearTimeout(t);
  }, [score, animated]);
  const r = size / 2 - 7, c = 2 * Math.PI * r, dash = (d / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.gold} strokeWidth="6"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.04s linear", filter: `drop-shadow(0 0 6px ${T.gold}88)` }} />
    </svg>
  );
}

// ── Tier Badge ────────────────────────────────────────────────────────────────
function TierBadge({ tier }) {
  const map = { 1: [T.gold, "Tier 1 · Top Fan"], 2: [T.violet, "Tier 2 · Loyal Fan"], 3: [T.teal, "Tier 3 · Verified"] };
  const [col, label] = map[tier] ?? [T.muted, "Unranked"];
  return (
    <span style={{ background: col+"18", border: `1px solid ${col}55`, color: col, borderRadius: 99, padding: "3px 11px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>
      {label}
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 42, height: 23, borderRadius: 99, background: value ? T.gold : T.border, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 22 : 3, width: 17, height: 17, borderRadius: 99, background: value ? T.bg : T.muted, transition: "left 0.2s" }} />
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max = 40, color = T.gold, label }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: T.muted, fontSize: 12 }}>{label}</span>
        <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>{value} pts</span>
      </div>
      <div style={{ background: T.border, borderRadius: 99, height: 5 }}>
        <div style={{ width: `${(value/max)*100}%`, background: color, height: "100%", borderRadius: 99, transition: "width 1s ease", boxShadow: `0 0 8px ${color}66` }} />
      </div>
    </div>
  );
}

// ── Concert Card ──────────────────────────────────────────────────────────────
function ConcertCard({ concert, userTier, onBuy }) {
  const unlocked = userTier <= 2;
  const soldPct = Math.round(((concert.totalTickets - concert.remaining) / concert.totalTickets) * 100);
  const almostGone = concert.remaining < 300;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", marginBottom: 14, transition: "transform 0.2s, border-color 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = T.borderHi; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = T.border; }}>

      {/* Hero image */}
      <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
        <img src={concert.img} alt={concert.artist} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, #16161F 0%, ${concert.accent}44 50%, transparent 100%)` }} />
        {/* Genre pill */}
        <div style={{ position: "absolute", top: 12, left: 12, background: "#00000066", backdropFilter: "blur(8px)", borderRadius: 99, padding: "4px 10px", fontSize: 11, color: "#ffffff99", fontWeight: 600 }}>
          {concert.genre}
        </div>
        {/* Price */}
        <div style={{ position: "absolute", top: 12, right: 12, background: T.gold, borderRadius: 99, padding: "4px 12px", fontSize: 13, color: T.bg, fontWeight: 800 }}>
          £{concert.price}
        </div>
        {/* Artist name over image */}
        <div style={{ position: "absolute", bottom: 12, left: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", textShadow: "0 2px 8px #00000088" }}>{concert.artist}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 2 }}>📍 {concert.venue}</div>
            <div style={{ fontSize: 12, color: T.muted }}>📅 {concert.date} · {concert.time}</div>
          </div>
        </div>

        {/* Sold bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: T.muted }}>Availability</span>
            <span style={{ fontSize: 11, color: almostGone ? "#FF6B6B" : T.muted, fontWeight: almostGone ? 700 : 400 }}>
              {almostGone ? "⚡ " : ""}{concert.remaining} remaining
            </span>
          </div>
          <div style={{ background: T.border, borderRadius: 99, height: 4 }}>
            <div style={{ width: `${soldPct}%`, height: "100%", borderRadius: 99, background: almostGone ? "#FF6B6B" : T.gold, transition: "width 1s ease" }} />
          </div>
        </div>

        {/* Access windows */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { label: "Tier 1", date: concert.tier1Opens, color: T.gold },
            { label: "Tier 2", date: concert.tier2Opens, color: T.violet },
            { label: "Public", date: concert.publicOpens, color: T.teal },
          ].map(w => (
            <div key={w.label} style={{ background: w.color+"12", border: `1px solid ${w.color}33`, borderRadius: 8, padding: "4px 8px", fontSize: 10 }}>
              <span style={{ color: w.color, fontWeight: 700 }}>{w.label}</span>
              <span style={{ color: T.muted, marginLeft: 4 }}>{w.date}</span>
            </div>
          ))}
        </div>

        <button onClick={() => onBuy(concert)} style={{
          width: "100%",
          background: unlocked ? T.gold : T.surface,
          color: unlocked ? T.bg : T.muted,
          border: unlocked ? "none" : `1px solid ${T.border}`,
          borderRadius: 12, padding: "12px 0",
          fontWeight: 700, fontSize: 14, cursor: unlocked ? "pointer" : "not-allowed",
          letterSpacing: 0.2, transition: "opacity 0.15s",
        }}
          onMouseEnter={e => unlocked && (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          {unlocked ? "Get Early Access →" : "🔒 Build Score to Unlock"}
        </button>
      </div>
    </div>
  );
}

// ── Splash ────────────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setVis(true); const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, transition: "opacity 0.5s", opacity: vis ? 1 : 0 }}>
      <div style={{ transform: vis ? "scale(1)" : "scale(0.85)", transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)", marginBottom: 20 }}>
        <Logo size={40} />
      </div>
      <p style={{ color: T.muted, fontSize: 13, opacity: vis ? 1 : 0, transition: "opacity 0.5s 0.5s" }}>Built for fans. Not bots.</p>
      {/* Animated dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 48, opacity: vis ? 1 : 0, transition: "opacity 0.5s 0.8s" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: 99, background: T.gold, animation: `bounce 1.2s ${i*0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }`}</style>
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function OnboardingScreen({ onDone }) {
  const [slide, setSlide] = useState(0);
  const cur = ONBOARDING[slide];
  const isLast = slide === ONBOARDING.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", fontFamily: "'Inter',sans-serif", maxWidth: 480, margin: "0 auto", position: "relative", overflow: "hidden" }}>
      {/* Background image */}
      <div style={{ position: "absolute", inset: 0, transition: "all 0.5s" }}>
        <img src={cur.bg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.15 }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${T.bg} 50%, transparent 100%)` }} />
      </div>

      {/* Skip */}
      <div style={{ position: "relative", padding: "52px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size={22} />
        <button onClick={onDone} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 99, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>Skip</button>
      </div>

      {/* Content */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 28px 52px" }}>
        <h2 style={{ fontSize: 30, fontWeight: 900, color: T.text, margin: "0 0 14px", lineHeight: 1.15 }}>{cur.title}</h2>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.7, margin: "0 0 32px" }}>{cur.body}</p>

        {/* Dots */}
        <div style={{ display: "flex", gap: 7, marginBottom: 24 }}>
          {ONBOARDING.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{ height: 5, borderRadius: 99, width: i === slide ? 28 : 8, background: i === slide ? cur.accent : T.border, transition: "all 0.3s", cursor: "pointer" }} />
          ))}
        </div>

        <button onClick={() => isLast ? onDone() : setSlide(s => s + 1)} style={{ width: "100%", background: cur.accent, border: "none", borderRadius: 14, padding: "16px 0", fontWeight: 800, fontSize: 16, color: T.bg, cursor: "pointer", letterSpacing: 0.2 }}>
          {isLast ? "Get Started →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function AuthScreen({ mode, setMode }) {
  const app = { variables: { colorPrimary: T.gold, colorBackground: T.card, colorText: T.text, colorTextSecondary: T.muted, colorInputBackground: T.surface, colorInputText: T.text, borderRadius: "12px" } };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Logo size={32} />
        <p style={{ color: T.muted, fontSize: 13, margin: "14px 0 0" }}>{mode === "sign-in" ? "Welcome back." : "Join the fan-first movement."}</p>
      </div>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {mode === "sign-in" ? <SignIn appearance={app} routing="hash" /> : <SignUp appearance={app} routing="hash" />}
      </div>
      <p style={{ color: T.muted, fontSize: 13, marginTop: 20 }}>
        {mode === "sign-in" ? "No account? " : "Have an account? "}
        <button onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} style={{ background: "none", border: "none", color: T.gold, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
          {mode === "sign-in" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

// ── Profile Drawer ────────────────────────────────────────────────────────────
function ProfileDrawer({ open, onClose, user, localPhoto, onPhotoChange, onSignOut }) {
  const fileRef = useRef();
  const [spotifyLinked,  setSpotifyLinked]  = useState(false);
  const [appleLinked,    setAppleLinked]    = useState(false);
  const [notifications,  setNotifications]  = useState(true);
  const [emailAlerts,    setEmailAlerts]    = useState(true);
  const [earlyAccess,    setEarlyAccess]    = useState(true);

  const name  = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.emailAddresses?.[0]?.emailAddress ?? "Fan";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const imgSrc = localPhoto || user?.imageUrl;
  const initials = user?.firstName?.[0] ?? email?.[0]?.toUpperCase() ?? "F";

  function SectionLabel({ title }) {
    return <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.8, fontWeight: 700, textTransform: "uppercase", padding: "16px 20px 6px" }}>{title}</div>;
  }

  function Row({ icon, label, sublabel, right, onClick, danger, tag }) {
    return (
      <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 20px", cursor: onClick ? "pointer" : "default", transition: "background 0.15s", borderBottom: `1px solid ${T.border}` }}
        onMouseEnter={e => onClick && (e.currentTarget.style.background = T.surface)}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: danger ? "#FF6B6B18" : T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14, color: danger ? "#FF6B6B" : T.text, fontWeight: 500 }}>{label}</span>
            {tag && <span style={{ fontSize: 9, background: T.gold+"18", color: T.gold, border: `1px solid ${T.gold}44`, borderRadius: 99, padding: "1px 7px", fontWeight: 700, letterSpacing: 0.5 }}>{tag}</span>}
          </div>
          {sublabel && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{sublabel}</div>}
        </div>
        {right || (onClick && !danger && <span style={{ color: T.subtle, fontSize: 17 }}>›</span>)}
      </div>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 200, opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none", transition: "opacity 0.25s", backdropFilter: "blur(8px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "88%", maxWidth: 360, background: T.surface, zIndex: 201, transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", overflowY: "auto", borderLeft: `1px solid ${T.border}` }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(160deg, ${T.card} 0%, #1A1020 100%)`, padding: "52px 20px 24px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: T.border, border: "none", color: T.muted, borderRadius: 99, width: 28, height: 28, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

          {/* Avatar */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
            <div style={{ width: 72, height: 72, borderRadius: 99, border: `2.5px solid ${T.gold}`, overflow: "hidden", background: T.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: T.gold }}>
              {imgSrc ? <img src={imgSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, background: T.gold, border: `2px solid ${T.surface}`, borderRadius: 99, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, cursor: "pointer" }}>📷</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) onPhotoChange(URL.createObjectURL(f)); }} />
          </div>

          <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{name}</div>
          <div style={{ fontSize: 12, color: T.muted, margin: "2px 0 12px" }}>{email}</div>
          <TierBadge tier={2} />
        </div>

        {/* Score mini card */}
        <div style={{ margin: "12px 14px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ScoreRing score={78} size={50} animated />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: T.gold }}>78</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Fan Score</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Link Spotify to earn <span style={{ color: T.gold }}>+18 pts</span></div>
          </div>
          <div style={{ marginLeft: "auto", color: T.subtle, fontSize: 17 }}>›</div>
        </div>

        {/* Sections */}
        <div style={{ paddingBottom: 40 }}>
          <SectionLabel title="Account" />
          <Row icon="👤" label="Edit Profile" sublabel="Name, bio, location" onClick={() => {}} />
          <Row icon="🔒" label="Change Password" onClick={() => {}} />
          <Row icon="📧" label="Email Preferences" sublabel={email} onClick={() => {}} />
          <Row icon="🪪" label="Verify Identity" sublabel="Required for purchases" tag="REQUIRED" onClick={() => {}} />

          <SectionLabel title="Connect Music" />
          <Row icon="🟢" label="Spotify" sublabel={spotifyLinked ? "Connected · boosts score" : "Not connected"} right={<Toggle value={spotifyLinked} onChange={setSpotifyLinked} />} />
          <Row icon="🎵" label="Apple Music" sublabel={appleLinked ? "Connected" : "Not connected"} right={<Toggle value={appleLinked} onChange={setAppleLinked} />} />
          <Row icon="⭐" label="Score Breakdown" sublabel="How your score is calculated" onClick={() => {}} />

          <SectionLabel title="Notifications" />
          <Row icon="🔔" label="Push Notifications" right={<Toggle value={notifications} onChange={setNotifications} />} />
          <Row icon="📩" label="Email Alerts" right={<Toggle value={emailAlerts} onChange={setEmailAlerts} />} />
          <Row icon="🎟" label="Early Access Alerts" right={<Toggle value={earlyAccess} onChange={setEarlyAccess} />} />

          <SectionLabel title="Tickets & Payments" />
          <Row icon="🎟" label="My Tickets" onClick={() => {}} />
          <Row icon="💳" label="Payment Methods" onClick={() => {}} />
          <Row icon="📋" label="Purchase History" onClick={() => {}} />
          <Row icon="🔁" label="Resale Requests" onClick={() => {}} />
          <Row icon="⏳" label="Waitlists" sublabel="1 active" onClick={() => {}} />

          <SectionLabel title="Support" />
          <Row icon="❓" label="Help Centre" onClick={() => {}} />
          <Row icon="💬" label="Contact Support" onClick={() => {}} />
          <Row icon="📜" label="Terms & Privacy" onClick={() => {}} />

          <SectionLabel title="" />
          <Row icon="🚪" label="Sign Out" danger onClick={onSignOut} />

          <p style={{ textAlign: "center", color: T.subtle, fontSize: 11, margin: "24px 0 0", letterSpacing: 0.5 }}>FanFirst v1.0 · Built for fans ✦</p>
        </div>
      </div>
    </>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function MainApp() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [tab,        setTab]        = useState("discover");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(null);
  const [buying,     setBuying]     = useState(null);
  const [purchased,  setPurchased]  = useState(false);
  const [qty,        setQty]        = useState(1);

  const fanScore = 78, userTier = 2;
  const imgSrc = localPhoto || user?.imageUrl;
  const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "F";

  const myTickets = [{ artist: "Hozier", venue: "O2 Arena, London", date: "Sat 14 Sep 2026", seat: "Block B, Row 4", img: CONCERTS[0].img }];
  const tabs = [{ id: "discover", label: "Discover", icon: "♪" }, { id: "profile", label: "Profile", icon: "◉" }, { id: "tickets", label: "Tickets", icon: "◈" }];

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: T.bg, minHeight: "100vh", color: T.text, maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px 14px", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size={24} />
          {/* Avatar button */}
          <button onClick={() => setDrawerOpen(true)} style={{ width: 38, height: 38, borderRadius: 99, border: `2px solid ${T.gold}`, background: T.border, overflow: "hidden", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.gold, position: "relative" }}>
            {imgSrc ? <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, background: "#4CAF50", borderRadius: 99, border: `2px solid ${T.bg}` }} />
          </button>
        </div>
        {/* Page title */}
        <h1 style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: -0.5 }}>
          {tab === "discover" && "Upcoming Shows"}
          {tab === "profile"  && "Fan Profile"}
          {tab === "tickets"  && "My Tickets"}
        </h1>
      </div>

      <div style={{ padding: "18px 14px" }}>

        {/* ── DISCOVER ── */}
        {tab === "discover" && (
          <>
            {/* Fan score banner */}
            <div style={{ background: `linear-gradient(135deg, ${T.card} 0%, #1A0F28 100%)`, border: `1px solid ${T.borderHi}`, borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ScoreRing score={fanScore} size={60} animated />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: T.gold }}>{fanScore}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 5 }}>Hey {user?.firstName ?? "there"} 👋</div>
                <TierBadge tier={userTier} />
                <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>Early access opens <span style={{ color: T.violet, fontWeight: 600 }}>7 days early</span></div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Available to you now</div>
            {CONCERTS.map(c => <ConcertCard key={c.id} concert={c} userTier={userTier} onBuy={c => { setBuying(c); setPurchased(false); setQty(1); }} />)}
          </>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, marginBottom: 14, textAlign: "center" }}>
              <button onClick={() => setDrawerOpen(true)} style={{ width: 88, height: 88, borderRadius: 99, border: `3px solid ${T.gold}`, background: T.border, overflow: "hidden", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: T.gold, margin: "0 auto 4px" }}>
                {imgSrc ? <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
              </button>
              <div style={{ fontSize: 11, color: T.gold, marginBottom: 12, cursor: "pointer" }} onClick={() => setDrawerOpen(true)}>Tap to edit profile →</div>
              <div style={{ position: "relative", display: "inline-block" }}>
                <ScoreRing score={fanScore} size={96} animated />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: T.gold }}>{fanScore}</span>
                  <span style={{ fontSize: 10, color: T.muted }}>/ 100</span>
                </div>
              </div>
              <h2 style={{ margin: "12px 0 6px", color: T.text, fontWeight: 800 }}>
                {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : email}
              </h2>
              <TierBadge tier={userTier} />
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#4CAF50" }}>✓ Identity Verified</p>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Score Breakdown</div>
              <ProgressBar value={32} label="🎵 Streaming history" color={T.gold} />
              <ProgressBar value={20} label="🎪 Past attendance"   color={T.violet} />
              <ProgressBar value={14} label="👕 Merch purchases"   color={T.teal} />
              <ProgressBar value={12} label="📱 Social engagement" color="#FF9F7F" />
              <div onClick={() => setDrawerOpen(true)} style={{ marginTop: 14, padding: "11px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 12, color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>💡 Link Spotify to earn <strong style={{ color: T.gold }}>+18 pts</strong></span>
                <span style={{ color: T.gold, fontSize: 12 }}>Connect →</span>
              </div>
            </div>

            <button onClick={() => setDrawerOpen(true)} style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "13px 0", color: T.text, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
              ⚙️  Account Settings
            </button>
          </>
        )}

        {/* ── TICKETS ── */}
        {tab === "tickets" && (
          <>
            {myTickets.map((t, i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ position: "relative", height: 120 }}>
                  <img src={t.img} alt={t.artist} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #16161F 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", bottom: 12, left: 14, fontSize: 18, fontWeight: 900, color: "#fff" }}>{t.artist}</div>
                  <div style={{ position: "absolute", top: 12, right: 12, background: "#4CAF5022", border: "1px solid #4CAF5066", color: "#4CAF50", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>✓ Confirmed</div>
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 3 }}>📍 {t.venue}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 3 }}>📅 {t.date}</div>
                  <div style={{ fontSize: 12, color: T.violet, fontWeight: 600, marginBottom: 14 }}>🪑 {t.seat}</div>
                  <div style={{ background: T.surface, borderRadius: 10, padding: "10px 12px", fontSize: 11, color: T.muted, lineHeight: 1.6, marginBottom: 12 }}>
                    🔒 Named ticket · ID required at door · Issued 48hrs before show
                  </div>
                  <button style={{ width: "100%", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 0", color: T.muted, fontSize: 13, cursor: "pointer" }}>Request Transfer →</button>
                </div>
              </div>
            ))}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>⏳ Waitlisted</div>
              <div style={{ fontSize: 13, color: T.muted }}>You're on the waitlist for <strong style={{ color: T.violet }}>Billie Eilish</strong> — position #47.</div>
            </div>
          </>
        )}
      </div>

      {/* Profile Drawer */}
      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} localPhoto={localPhoto} onPhotoChange={setLocalPhoto} onSignOut={() => { setDrawerOpen(false); signOut(); }} />

      {/* Buy Modal */}
      {buying && (
        <div style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100, backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setBuying(null)}>
          <div style={{ background: T.card, width: "100%", maxWidth: 480, borderRadius: "22px 22px 0 0", overflow: "hidden", border: `1px solid ${T.border}` }}>
            {/* Hero */}
            <div style={{ position: "relative", height: 140 }}>
              <img src={buying.img} alt={buying.artist} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #16161F 0%, transparent 60%)" }} />
              <button onClick={() => setBuying(null)} style={{ position: "absolute", top: 12, right: 12, background: "#00000066", border: "none", color: "#fff", borderRadius: 99, width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              <div style={{ position: "absolute", bottom: 12, left: 16 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{buying.artist}</div>
                <div style={{ fontSize: 12, color: "#ffffff88" }}>{buying.venue} · {buying.date}</div>
              </div>
            </div>

            <div style={{ padding: "20px 20px 36px" }}>
              {!purchased ? (
                <>
                  <TierBadge tier={userTier} />
                  <p style={{ color: T.muted, fontSize: 13, margin: "10px 0 16px" }}>Max 2 tickets per verified identity.</p>
                  <div style={{ background: T.surface, borderRadius: 14, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ color: T.muted, fontSize: 13 }}>Ticket price</span>
                      <span style={{ fontWeight: 700 }}>£{buying.price}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: T.muted, fontSize: 13 }}>Quantity</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button onClick={() => setQty(Math.max(1, qty-1))} style={{ background: T.border, border: "none", color: T.text, borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center" }}>{qty}</span>
                        <button onClick={() => setQty(Math.min(2, qty+1))} style={{ background: T.border, border: "none", color: T.text, borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      </div>
                    </div>
                    <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700 }}>Total</span>
                      <span style={{ fontWeight: 800, color: T.gold, fontSize: 16 }}>£{buying.price * qty}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>🔒 Named & non-transferable · ID checked at door · Issued 48hrs before show</div>
                  <button onClick={() => setPurchased(true)} style={{ width: "100%", background: T.gold, border: "none", borderRadius: 14, padding: "15px 0", fontWeight: 800, fontSize: 15, color: T.bg, cursor: "pointer", letterSpacing: 0.2 }}>
                    Confirm — £{buying.price * qty}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
                  <h2 style={{ color: T.gold, margin: "0 0 8px", fontSize: 22 }}>You're going!</h2>
                  <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6 }}>
                    {qty} × {buying.artist} ticket{qty > 1 ? "s" : ""} confirmed.<br />Your named ticket arrives 48hrs before the show.
                  </p>
                  <button onClick={() => { setBuying(null); setTab("tickets"); }} style={{ marginTop: 20, background: T.gold, border: "none", borderRadius: 14, padding: "13px 36px", fontWeight: 700, fontSize: 14, color: T.bg, cursor: "pointer" }}>
                    View My Tickets →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", padding: "10px 0 22px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 19, color: tab === t.id ? T.gold : T.muted, transition: "color 0.2s" }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: tab === t.id ? T.gold : T.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 18, height: 2.5, background: T.gold, borderRadius: 99, boxShadow: `0 0 8px ${T.gold}` }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
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