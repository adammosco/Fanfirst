import { useState } from "react";

// ── Palette ──────────────────────────────────────────────────────────────────
// #0A0A0F  — near-black stage dark
// #1A1A2E  — deep navy body bg
// #E8C547  — amber spotlight (primary accent)
// #C4A0FF  — soft violet (secondary / score fills)
// #F0EDE8  — warm off-white text
// #2A2A3E  — card surface

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_CONCERTS = [
  {
    id: 1,
    artist: "Hozier",
    venue: "O2 Arena, London",
    date: "Sat 14 Sep 2026",
    time: "19:30",
    price: "£65",
    img: "🎸",
    tier1Opens: "31 Aug",
    tier2Opens: "7 Sep",
    publicOpens: "11 Sep",
    totalTickets: 2000,
    remaining: 843,
  },
  {
    id: 2,
    artist: "Billie Eilish",
    venue: "Manchester AO Arena",
    date: "Fri 3 Oct 2026",
    time: "20:00",
    price: "£72",
    img: "🎤",
    tier1Opens: "19 Sep",
    tier2Opens: "26 Sep",
    publicOpens: "30 Sep",
    totalTickets: 1500,
    remaining: 210,
  },
  {
    id: 3,
    artist: "Kendrick Lamar",
    venue: "Wembley Stadium, London",
    date: "Sat 18 Oct 2026",
    time: "18:00",
    price: "£89",
    img: "🎧",
    tier1Opens: "4 Oct",
    tier2Opens: "11 Oct",
    publicOpens: "15 Oct",
    totalTickets: 5000,
    remaining: 3201,
  },
];

const MOCK_USER = {
  name: "Alex Rivera",
  avatar: "AR",
  fanScore: 78,
  tier: 2,
  verified: true,
  breakdown: {
    streaming: 32,
    attendance: 20,
    merch: 14,
    social: 12,
  },
  myTickets: [
    { artist: "Hozier", venue: "O2 Arena, London", date: "Sat 14 Sep 2026", seat: "Block B, Row 4", status: "confirmed" },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80 }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A2A3E" strokeWidth="7" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#E8C547" strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

function TierBadge({ tier }) {
  const colours = { 1: "#E8C547", 2: "#C4A0FF", 3: "#7EC8E3" };
  const labels = { 1: "Tier 1 — Top Fan", 2: "Tier 2 — Loyal Fan", 3: "Tier 3 — Verified" };
  return (
    <span style={{
      background: colours[tier] + "22",
      border: `1px solid ${colours[tier]}`,
      color: colours[tier],
      borderRadius: 99, padding: "3px 12px",
      fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
    }}>
      {labels[tier]}
    </span>
  );
}

function ProgressBar({ value, color = "#E8C547", label }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#9090A0", fontSize: 12 }}>{label}</span>
        <span style={{ color: "#F0EDE8", fontSize: 12, fontWeight: 600 }}>{value}pts</span>
      </div>
      <div style={{ background: "#2A2A3E", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{
          width: `${(value / 40) * 100}%`, background: color,
          height: "100%", borderRadius: 99,
          transition: "width 0.8s ease",
        }} />
      </div>
    </div>
  );
}

function ConcertCard({ concert, userTier, onBuy }) {
  const tierUnlocked = userTier <= 2;
  const soldPct = Math.round(((concert.totalTickets - concert.remaining) / concert.totalTickets) * 100);

  return (
    <div style={{
      background: "#1A1A2E", border: "1px solid #2A2A3E",
      borderRadius: 16, padding: 20, marginBottom: 16,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#E8C54766"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#2A2A3E"}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{
          fontSize: 36, background: "#2A2A3E", borderRadius: 12,
          width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {concert.img}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0, color: "#F0EDE8", fontSize: 18, fontWeight: 700 }}>{concert.artist}</h3>
            <span style={{ color: "#E8C547", fontWeight: 700, fontSize: 16 }}>{concert.price}</span>
          </div>
          <p style={{ margin: "4px 0 0", color: "#7070A0", fontSize: 13 }}>📍 {concert.venue}</p>
          <p style={{ margin: "2px 0 0", color: "#7070A0", fontSize: 13 }}>📅 {concert.date} · {concert.time}</p>

          {/* Sold out bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#9090A0", fontSize: 11 }}>Tickets sold</span>
              <span style={{ color: soldPct > 80 ? "#FF6B6B" : "#7070A0", fontSize: 11 }}>{concert.remaining} left</span>
            </div>
            <div style={{ background: "#0A0A0F", borderRadius: 99, height: 4 }}>
              <div style={{
                width: `${soldPct}%`, height: "100%", borderRadius: 99,
                background: soldPct > 80 ? "#FF6B6B" : "#E8C547",
              }} />
            </div>
          </div>

          {/* Access windows */}
          <div style={{
            display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap",
          }}>
            {[
              { label: "Tier 1", date: concert.tier1Opens, color: "#E8C547" },
              { label: "Tier 2", date: concert.tier2Opens, color: "#C4A0FF" },
              { label: "Public", date: concert.publicOpens, color: "#7EC8E3" },
            ].map(w => (
              <div key={w.label} style={{
                background: w.color + "15", border: `1px solid ${w.color}44`,
                borderRadius: 8, padding: "4px 8px", fontSize: 11,
              }}>
                <span style={{ color: w.color, fontWeight: 700 }}>{w.label}</span>
                <span style={{ color: "#9090A0", marginLeft: 4 }}>{w.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onBuy(concert)}
        style={{
          marginTop: 16, width: "100%",
          background: tierUnlocked ? "#E8C547" : "#2A2A3E",
          color: tierUnlocked ? "#0A0A0F" : "#606080",
          border: tierUnlocked ? "none" : "1px solid #3A3A5E",
          borderRadius: 10, padding: "11px 0",
          fontWeight: 700, fontSize: 14, cursor: tierUnlocked ? "pointer" : "not-allowed",
          letterSpacing: 0.3, transition: "opacity 0.2s",
        }}
        onMouseEnter={e => tierUnlocked && (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        {tierUnlocked ? "🎟 Get Early Access" : "🔒 Build Fan Score to Unlock"}
      </button>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("discover");
  const [buying, setBuying] = useState(null);
  const [purchased, setPurchased] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const user = MOCK_USER;

  function handleBuy(concert) {
    setBuying(concert);
    setPurchased(false);
    setTicketCount(1);
  }

  function confirmPurchase() {
    setPurchased(true);
  }

  const tabs = [
    { id: "discover", label: "Discover", icon: "🎵" },
    { id: "profile", label: "My Profile", icon: "👤" },
    { id: "tickets", label: "My Tickets", icon: "🎟" },
  ];

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: "#0A0A0F", minHeight: "100vh",
      color: "#F0EDE8", maxWidth: 480, margin: "0 auto",
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        background: "#1A1A2E", borderBottom: "1px solid #2A2A3E",
        padding: "18px 20px 14px", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: "#E8C547", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>
              ✦ FanFirst Ticketing
            </div>
            <h1 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#F0EDE8" }}>
              {tab === "discover" && "Upcoming Shows"}
              {tab === "profile" && "Fan Profile"}
              {tab === "tickets" && "My Tickets"}
            </h1>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 99,
            background: "#E8C54722", border: "2px solid #E8C547",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: "#E8C547",
          }}>
            {user.avatar}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px" }}>

        {/* ── DISCOVER TAB ── */}
        {tab === "discover" && (
          <>
            {/* Fan Score banner */}
            <div style={{
              background: "linear-gradient(135deg, #1A1A2E 0%, #2A1A3E 100%)",
              border: "1px solid #3A2A5E", borderRadius: 16, padding: 16,
              display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ScoreRing score={user.fanScore} size={64} />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  transform: "rotate(0deg)",
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#E8C547" }}>{user.fanScore}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9090A0", marginBottom: 4 }}>Your Fan Score</div>
                <TierBadge tier={user.tier} />
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#7070A0" }}>
                  Early access opens <strong style={{ color: "#C4A0FF" }}>7 days</strong> before public sale
                </p>
              </div>
            </div>

            <h2 style={{ fontSize: 13, color: "#9090A0", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 12px", fontWeight: 600 }}>
              Available to you now
            </h2>

            {MOCK_CONCERTS.map(c => (
              <ConcertCard key={c.id} concert={c} userTier={user.tier} onBuy={handleBuy} />
            ))}
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <>
            <div style={{
              background: "#1A1A2E", border: "1px solid #2A2A3E",
              borderRadius: 16, padding: 20, marginBottom: 16,
              textAlign: "center",
            }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <ScoreRing score={user.fanScore} size={100} />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: "#E8C547" }}>{user.fanScore}</span>
                  <span style={{ fontSize: 10, color: "#9090A0" }}>/ 100</span>
                </div>
              </div>
              <h2 style={{ margin: "12px 0 4px", color: "#F0EDE8" }}>{user.name}</h2>
              <TierBadge tier={user.tier} />
              {user.verified && (
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "#4CAF50" }}>✓ Identity Verified</p>
              )}
            </div>

            <div style={{ background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 16px", color: "#F0EDE8", fontSize: 15 }}>Score Breakdown</h3>
              <ProgressBar value={user.breakdown.streaming} label="🎵 Streaming history" color="#E8C547" />
              <ProgressBar value={user.breakdown.attendance} label="🎪 Past attendance" color="#C4A0FF" />
              <ProgressBar value={user.breakdown.merch} label="👕 Merch purchases" color="#7EC8E3" />
              <ProgressBar value={user.breakdown.social} label="📱 Social engagement" color="#FF9F7F" />
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#0A0A0F", borderRadius: 10, fontSize: 12, color: "#7070A0" }}>
                💡 Link your Spotify to boost your streaming score by up to <strong style={{ color: "#E8C547" }}>+18 pts</strong>
              </div>
            </div>

            <div style={{ background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: "0 0 14px", color: "#F0EDE8", fontSize: 15 }}>Access Windows</h3>
              {[
                { tier: 1, label: "Tier 1 — Top Fan", desc: "Top 10% score", color: "#E8C547", unlocked: false },
                { tier: 2, label: "Tier 2 — Loyal Fan", desc: "Top 25% score", color: "#C4A0FF", unlocked: true },
                { tier: 3, label: "Tier 3 — Verified", desc: "All verified users", color: "#7EC8E3", unlocked: true },
              ].map(w => (
                <div key={w.tier} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0",
                  borderBottom: w.tier < 3 ? "1px solid #2A2A3E" : "none",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 99,
                    background: w.unlocked ? w.color + "22" : "#2A2A3E",
                    border: `2px solid ${w.unlocked ? w.color : "#3A3A5E"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14,
                  }}>
                    {w.unlocked ? "✓" : "🔒"}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: w.unlocked ? w.color : "#606080" }}>{w.label}</div>
                    <div style={{ fontSize: 11, color: "#7070A0" }}>{w.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TICKETS TAB ── */}
        {tab === "tickets" && (
          <>
            {user.myTickets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#7070A0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎟</div>
                <p>No tickets yet. Discover shows and use your fan score to get early access.</p>
              </div>
            ) : (
              user.myTickets.map((t, i) => (
                <div key={i} style={{
                  background: "linear-gradient(135deg, #1A1A2E 0%, #1A2A1E 100%)",
                  border: "1px solid #2A4A2E", borderRadius: 16, padding: 20, marginBottom: 12,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, color: "#F0EDE8" }}>{t.artist}</h3>
                      <p style={{ margin: "4px 0 0", color: "#7070A0", fontSize: 13 }}>📍 {t.venue}</p>
                      <p style={{ margin: "2px 0 0", color: "#7070A0", fontSize: 13 }}>📅 {t.date}</p>
                      <p style={{ margin: "2px 0 0", color: "#C4A0FF", fontSize: 13, fontWeight: 600 }}>🪑 {t.seat}</p>
                    </div>
                    <span style={{
                      background: "#4CAF5022", border: "1px solid #4CAF5066",
                      color: "#4CAF50", borderRadius: 99, padding: "4px 10px",
                      fontSize: 11, fontWeight: 700,
                    }}>✓ Confirmed</span>
                  </div>

                  <div style={{
                    marginTop: 16, padding: "12px 14px",
                    background: "#0A0A0F", borderRadius: 10,
                    fontSize: 11, color: "#9090A0", lineHeight: 1.6,
                  }}>
                    🔒 Ticket issued 48hrs before show · Named ticket — ID required at door · Non-transferable without approval
                  </div>

                  <button style={{
                    marginTop: 12, width: "100%",
                    background: "transparent", border: "1px solid #3A3A5E",
                    borderRadius: 10, padding: "9px 0",
                    color: "#9090A0", fontSize: 13, cursor: "pointer",
                  }}>
                    Request Transfer →
                  </button>
                </div>
              ))
            )}

            <div style={{
              background: "#1A1A2E", border: "1px solid #2A2A3E",
              borderRadius: 16, padding: 16, marginTop: 8,
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#F0EDE8" }}>Waitlisted</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#7070A0" }}>
                You're on the waitlist for <strong style={{ color: "#C4A0FF" }}>Billie Eilish</strong> — position #47.
                You'll be notified when a ticket becomes available at face value.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── BUY MODAL ── */}
      {buying && (
        <div style={{
          position: "fixed", inset: 0, background: "#0A0A0F99",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 100, backdropFilter: "blur(6px)",
        }}
          onClick={e => e.target === e.currentTarget && setBuying(null)}
        >
          <div style={{
            background: "#1A1A2E", width: "100%", maxWidth: 480,
            borderRadius: "20px 20px 0 0", padding: "24px 20px 40px",
            border: "1px solid #2A2A3E",
          }}>
            {!purchased ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{buying.artist}</h2>
                    <p style={{ margin: "4px 0 0", color: "#7070A0", fontSize: 13 }}>{buying.venue} · {buying.date}</p>
                  </div>
                  <button onClick={() => setBuying(null)} style={{
                    background: "#2A2A3E", border: "none", color: "#F0EDE8",
                    borderRadius: 99, width: 32, height: 32, cursor: "pointer", fontSize: 16,
                  }}>✕</button>
                </div>

                <TierBadge tier={user.tier} />
                <p style={{ color: "#7070A0", fontSize: 13, marginTop: 10 }}>
                  Your fan score grants you Tier 2 early access. Max 2 tickets per verified identity.
                </p>

                <div style={{ background: "#0A0A0F", borderRadius: 12, padding: 16, margin: "16px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#9090A0", fontSize: 13 }}>Ticket price</span>
                    <span>{buying.price}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#9090A0", fontSize: 13 }}>Quantity</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={() => setTicketCount(Math.max(1, ticketCount - 1))} style={{
                        background: "#2A2A3E", border: "none", color: "#F0EDE8",
                        borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16,
                      }}>−</button>
                      <span style={{ fontWeight: 700 }}>{ticketCount}</span>
                      <button onClick={() => setTicketCount(Math.min(2, ticketCount + 1))} style={{
                        background: "#2A2A3E", border: "none", color: "#F0EDE8",
                        borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16,
                      }}>+</button>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #2A2A3E", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 700, color: "#E8C547" }}>
                      £{parseInt(buying.price.replace("£", "")) * ticketCount}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#606080", marginBottom: 16, lineHeight: 1.6 }}>
                  🔒 Tickets are named & non-transferable · ID checked at door · Issued 48hrs before show
                </div>

                <button onClick={confirmPurchase} style={{
                  width: "100%", background: "#E8C547", border: "none",
                  borderRadius: 12, padding: "14px 0",
                  fontWeight: 800, fontSize: 15, color: "#0A0A0F", cursor: "pointer",
                  letterSpacing: 0.3,
                }}>
                  Confirm Purchase — £{parseInt(buying.price.replace("£", "")) * ticketCount}
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
                <h2 style={{ color: "#E8C547", margin: "0 0 8px" }}>You're going!</h2>
                <p style={{ color: "#7070A0", fontSize: 14 }}>
                  {ticketCount} × {buying.artist} ticket{ticketCount > 1 ? "s" : ""} confirmed for {buying.date}.
                  Your named ticket will arrive digitally 48hrs before the show.
                </p>
                <button onClick={() => { setBuying(null); setTab("tickets"); }} style={{
                  marginTop: 20, background: "#E8C547", border: "none",
                  borderRadius: 12, padding: "12px 32px",
                  fontWeight: 700, fontSize: 14, color: "#0A0A0F", cursor: "pointer",
                }}>
                  View My Tickets →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "#1A1A2E", borderTop: "1px solid #2A2A3E",
        display: "flex", padding: "10px 0 20px",
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: "none", border: "none",
            cursor: "pointer", padding: "6px 0",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: tab === t.id ? "#E8C547" : "#6060A0",
              letterSpacing: 0.3,
            }}>{t.label}</span>
            {tab === t.id && (
              <div style={{ width: 20, height: 2, background: "#E8C547", borderRadius: 99 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
