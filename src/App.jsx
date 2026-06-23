import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut, useClerk, useUser, SignIn, SignUp } from "@clerk/clerk-react";

const T = {
  bg:"#0A0A0F",surface:"#111118",card:"#16161F",
  border:"#1F1F2E",borderHi:"#2A2A3E",
  gold:"#E8C547",violet:"#A78BFA",teal:"#5EEAD4",
  text:"#F1F0F5",muted:"#6B6B85",subtle:"#3A3A52",
  green:"#4CAF50",red:"#FF6B6B",
};

const CONCERTS_DATA = [
  {id:1,artist:"Hozier",venue:"O2 Arena, London",date:"Sat 14 Sep 2026",time:"19:30",price:65,genre:"Folk · Soul",img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",accent:"#8B5E3C",tier1Opens:"31 Aug",tier2Opens:"7 Sep",publicOpens:"11 Sep",totalTickets:2000,remaining:843,description:"Hozier returns to London for one unforgettable night at the O2. Expect deep cuts, fan favourites, and that voice."},
  {id:2,artist:"Billie Eilish",venue:"Manchester AO Arena",date:"Fri 3 Oct 2026",time:"20:00",price:72,genre:"Pop · Alternative",img:"https://images.unsplash.com/photo-1501386761578-eaa54b02df9f?w=800&q=80",accent:"#1A6B4A",tier1Opens:"19 Sep",tier2Opens:"26 Sep",publicOpens:"30 Sep",totalTickets:1500,remaining:210,description:"Billie brings her world tour to Manchester. An intimate arena show packed with atmosphere and visuals."},
  {id:3,artist:"Kendrick Lamar",venue:"Wembley Stadium, London",date:"Sat 18 Oct 2026",time:"18:00",price:89,genre:"Hip-Hop · Rap",img:"https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",accent:"#6B3A8B",tier1Opens:"4 Oct",tier2Opens:"11 Oct",publicOpens:"15 Oct",totalTickets:5000,remaining:3201,description:"Kendrick Lamar at Wembley Stadium. A landmark event. Limited tickets remain across all tiers."},
  {id:4,artist:"Chappell Roan",venue:"Alexandra Palace, London",date:"Thu 5 Nov 2026",time:"19:00",price:55,genre:"Pop · Indie",img:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",accent:"#8B1A5A",tier1Opens:"22 Oct",tier2Opens:"29 Oct",publicOpens:"2 Nov",totalTickets:1200,remaining:512,description:"The breakout star of 2025 makes her UK headline debut at the iconic Alexandra Palace."},
  {id:5,artist:"Fred Again..",venue:"Fabric, London",date:"Sat 21 Nov 2026",time:"22:00",price:45,genre:"Electronic · Dance",img:"https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",accent:"#1A3A6B",tier1Opens:"8 Nov",tier2Opens:"15 Nov",publicOpens:"18 Nov",totalTickets:800,remaining:78,description:"Fred Again.. takes over Fabric for a rare club night. Very limited capacity."},
];

const GENRES = ["All","Folk · Soul","Pop · Alternative","Hip-Hop · Rap","Pop · Indie","Electronic · Dance"];

const QUIZ = [
  {id:"concerts",q:"How many concerts have you attended in the last 2 years?",opts:[{l:"None",p:0},{l:"1-2",p:5},{l:"3-5",p:12},{l:"6+",p:20}]},
  {id:"streaming",q:"How often do you stream music?",opts:[{l:"Rarely",p:0},{l:"A few times a week",p:8},{l:"Every day",p:16},{l:"All day long",p:20}]},
  {id:"merch",q:"Have you bought official artist merch?",opts:[{l:"Never",p:0},{l:"Once or twice",p:5},{l:"Regularly",p:14}]},
  {id:"social",q:"Do you engage with artist content online?",opts:[{l:"Not really",p:0},{l:"Sometimes like posts",p:4},{l:"Share and comment",p:8},{l:"Super fan always first",p:12}]},
  {id:"loyalty",q:"How long have you followed your favourite artists?",opts:[{l:"Just discovered them",p:0},{l:"1-2 years",p:5},{l:"3-5 years",p:10},{l:"5+ years",p:15}]},
];

const ONBOARDING_SLIDES = [
  {title:"Tickets for real fans.",body:"Your Fan Score gives you priority access before bots even wake up.",accent:T.gold,bg:"https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80"},
  {title:"Loyalty earns access.",body:"Streaming history, past attendance, and merch all count toward your score.",accent:T.violet,bg:"https://images.unsplash.com/photo-1501386761578-eaa54b02df9f?w=800&q=80"},
  {title:"Scalpers cannot win.",body:"Named tickets, ID checks, and face-value-only resale. Full stop.",accent:T.teal,bg:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80"},
];

const getTier = s => s >= 70 ? 1 : s >= 40 ? 2 : 3;
const getTierColor = t => ({1:T.gold,2:T.violet,3:T.teal})[t] || T.muted;
const getTierLabel = t => ({1:"Tier 1 Top Fan",2:"Tier 2 Loyal Fan",3:"Tier 3 Verified"})[t] || "Unranked";

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type="info") => {
    const id = Date.now();
    setToasts(p => [...p, {id, msg, type}]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return {toasts, show};
}

function Toast({toasts}) {
  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none",width:"90%",maxWidth:400}}>
      {toasts.map(t => (
        <div key={t.id} style={{background:t.type==="error"?T.red:t.type==="success"?T.green:T.card,color:t.type==="error"||t.type==="success"?"#fff":T.text,border:"1px solid "+T.border,borderRadius:12,padding:"10px 18px",fontSize:13,fontWeight:600,boxShadow:"0 4px 20px #00000066",textAlign:"center"}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Logo({size=28}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:9}}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="9" fill={T.gold}/>
        <path d="M9 8h14v3.5H13v4h9v3.5h-9V24H9V8z" fill="#0A0A0F"/>
      </svg>
      <span style={{fontSize:size*0.75,fontWeight:800,color:T.text,letterSpacing:-0.5}}>
        Fan<span style={{color:T.gold}}>First</span>
      </span>
    </div>
  );
}

function ScoreRing({score,size=80,animated=false}) {
  const [d, setD] = useState(animated ? 0 : score);
  useEffect(() => {
    if (!animated) { setD(score); return; }
    let v = 0;
    const go = () => { v += 1.5; if (v >= score) { setD(score); return; } setD(Math.round(v)); requestAnimationFrame(go); };
    const t = setTimeout(() => requestAnimationFrame(go), 300);
    return () => clearTimeout(t);
  }, [score, animated]);
  const r = size/2-7, c = 2*Math.PI*r, dash = (d/100)*c;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.gold} strokeWidth="6"
        strokeDasharray={dash+" "+c} strokeLinecap="round"
        style={{transition:"stroke-dasharray 0.03s linear",filter:"drop-shadow(0 0 6px "+T.gold+"88)"}}/>
    </svg>
  );
}

function TierBadge({tier}) {
  const col = getTierColor(tier);
  return <span style={{background:col+"18",border:"1px solid "+col+"55",color:col,borderRadius:99,padding:"3px 11px",fontSize:11,fontWeight:700,letterSpacing:0.4}}>{getTierLabel(tier)}</span>;
}

function Toggle({value,onChange}) {
  return (
    <div onClick={() => onChange(!value)} style={{width:42,height:23,borderRadius:99,background:value?T.gold:T.border,position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:value?22:3,width:17,height:17,borderRadius:99,background:value?T.bg:T.muted,transition:"left 0.2s"}}/>
    </div>
  );
}

function ProgressBar({value,max=100,color=T.gold,label}) {
  const pct = Math.min((value/max)*100, 100);
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{color:T.muted,fontSize:12}}>{label}</span>
        <span style={{color:T.text,fontSize:12,fontWeight:600}}>{value} pts</span>
      </div>
      <div style={{background:T.border,borderRadius:99,height:5}}>
        <div style={{width:pct+"%",background:color,height:"100%",borderRadius:99,transition:"width 1s ease",boxShadow:"0 0 8px "+color+"55"}}/>
      </div>
    </div>
  );
}

function Input({label,value,onChange,placeholder,type="text"}) {
  return (
    <div style={{marginBottom:14}}>
      {label && <div style={{fontSize:12,color:T.muted,marginBottom:6,fontWeight:600}}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",background:T.surface,border:"1px solid "+T.border,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,outline:"none",boxSizing:"border-box"}}
        onFocus={e => e.target.style.borderColor=T.gold}
        onBlur={e => e.target.style.borderColor=T.border}/>
    </div>
  );
}

function Modal({open,onClose,children,noPad=false}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#00000099",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300,backdropFilter:"blur(8px)"}}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{background:T.card,width:"100%",maxWidth:480,borderRadius:"22px 22px 0 0",border:"1px solid "+T.border,maxHeight:"90vh",overflowY:"auto"}}>
        {noPad ? children : <div style={{padding:"24px 20px 40px"}}>{children}</div>}
      </div>
    </div>
  );
}

function SplashScreen({onDone}) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setVis(true); const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{position:"fixed",inset:0,background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:999,opacity:vis?1:0,transition:"opacity 0.5s"}}>
      <div style={{transform:vis?"scale(1)":"scale(0.85)",transition:"transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",marginBottom:20}}>
        <Logo size={40}/>
      </div>
      <p style={{color:T.muted,fontSize:13,opacity:vis?1:0,transition:"opacity 0.5s 0.5s"}}>Built for fans. Not bots.</p>
      <div style={{display:"flex",gap:6,marginTop:48,opacity:vis?1:0,transition:"opacity 0.5s 0.8s"}}>
        {[0,1,2].map(i => <div key={i} style={{width:6,height:6,borderRadius:99,background:T.gold,animation:"bounce 1.2s "+(i*0.2)+"s infinite"}}/>)}
      </div>
      <style>{"@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}"}</style>
    </div>
  );
}

function OnboardingScreen({onDone}) {
  const [slide, setSlide] = useState(0);
  const cur = ONBOARDING_SLIDES[slide];
  const isLast = slide === ONBOARDING_SLIDES.length - 1;
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0}}>
        <img src={cur.bg} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.15}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,"+T.bg+" 55%,transparent 100%)"}}/>
      </div>
      <div style={{position:"relative",padding:"52px 24px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Logo size={22}/>
        <button onClick={onDone} style={{background:T.surface,border:"1px solid "+T.border,color:T.muted,borderRadius:99,padding:"6px 14px",fontSize:13,cursor:"pointer"}}>Skip</button>
      </div>
      <div style={{position:"relative",flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"0 28px 52px"}}>
        <h2 style={{fontSize:30,fontWeight:900,color:T.text,margin:"0 0 14px",lineHeight:1.15}}>{cur.title}</h2>
        <p style={{fontSize:15,color:T.muted,lineHeight:1.7,margin:"0 0 32px"}}>{cur.body}</p>
        <div style={{display:"flex",gap:7,marginBottom:24}}>
          {ONBOARDING_SLIDES.map((_,i) => (
            <div key={i} onClick={() => setSlide(i)} style={{height:5,borderRadius:99,width:i===slide?28:8,background:i===slide?cur.accent:T.border,transition:"all 0.3s",cursor:"pointer"}}/>
          ))}
        </div>
        <button onClick={() => isLast ? onDone() : setSlide(s => s+1)} style={{width:"100%",background:cur.accent,border:"none",borderRadius:14,padding:"16px 0",fontWeight:800,fontSize:16,color:T.bg,cursor:"pointer"}}>
          {isLast ? "Get Started" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function AuthScreen({mode,setMode}) {
  const app = {variables:{colorPrimary:T.gold,colorBackground:T.card,colorText:T.text,colorTextSecondary:T.muted,colorInputBackground:T.surface,colorInputText:T.text,borderRadius:"12px"}};
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <Logo size={32}/>
        <p style={{color:T.muted,fontSize:13,margin:"14px 0 0"}}>{mode==="sign-in"?"Welcome back.":"Join the fan-first movement."}</p>
      </div>
      <div style={{width:"100%",maxWidth:400}}>
        {mode==="sign-in" ? <SignIn appearance={app} routing="hash"/> : <SignUp appearance={app} routing="hash"/>}
      </div>
      <p style={{color:T.muted,fontSize:13,marginTop:20}}>
        {mode==="sign-in"?"No account? ":"Have an account? "}
        <button onClick={() => setMode(mode==="sign-in"?"sign-up":"sign-in")} style={{background:"none",border:"none",color:T.gold,fontWeight:700,cursor:"pointer",fontSize:13}}>
          {mode==="sign-in"?"Sign up":"Sign in"}
        </button>
      </p>
    </div>
  );
}
function QuizModal({open,onClose,onComplete}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  function pick(id, pts) {
    const next = {...answers, [id]: pts};
    setAnswers(next);
    if (step < QUIZ.length - 1) {
      setTimeout(() => setStep(s => s+1), 300);
    } else {
      const raw = Object.values(next).reduce((a,b) => a+b, 0);
      const max = QUIZ.reduce((a,q) => a + Math.max(...q.opts.map(o => o.p)), 0);
      setFinalScore(Math.round((raw/max)*100));
      setDone(true);
    }
  }

  function reset() { setStep(0); setAnswers({}); setDone(false); }
  const q = QUIZ[step];
  const progress = (step/QUIZ.length)*100;

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }}>
      {!done ? (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontSize:13,color:T.muted}}>Question {step+1} of {QUIZ.length}</div>
            <button onClick={() => { onClose(); reset(); }} style={{background:T.border,border:"none",color:T.muted,borderRadius:99,width:28,height:28,cursor:"pointer",fontSize:13}}>x</button>
          </div>
          <div style={{background:T.border,borderRadius:99,height:4,marginBottom:24}}>
            <div style={{width:progress+"%",background:T.gold,height:"100%",borderRadius:99,transition:"width 0.3s ease"}}/>
          </div>
          <h3 style={{fontSize:18,fontWeight:800,color:T.text,margin:"0 0 20px",lineHeight:1.3}}>{q.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.opts.map(o => (
              <button key={o.l} onClick={() => pick(q.id, o.p)} style={{background:answers[q.id]===o.p?T.gold+"22":T.surface,border:"1px solid "+(answers[q.id]===o.p?T.gold:T.border),borderRadius:12,padding:"13px 16px",color:answers[q.id]===o.p?T.gold:T.text,fontSize:14,cursor:"pointer",textAlign:"left",fontWeight:500,transition:"all 0.15s"}}>
                {o.l}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{textAlign:"center"}}>
          <div style={{position:"relative",display:"inline-block",margin:"8px 0 16px"}}>
            <ScoreRing score={finalScore} size={110} animated/>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:28,fontWeight:900,color:T.gold}}>{finalScore}</span>
              <span style={{fontSize:11,color:T.muted}}>/ 100</span>
            </div>
          </div>
          <h3 style={{fontSize:20,fontWeight:800,color:T.text,margin:"0 0 8px"}}>Your Fan Score</h3>
          <div style={{marginBottom:16}}><TierBadge tier={getTier(finalScore)}/></div>
          <p style={{color:T.muted,fontSize:13,lineHeight:1.6,margin:"0 0 24px"}}>
            {finalScore>=70?"You are a top-tier fan. Early access opens 2 weeks before the public sale.":finalScore>=40?"Loyal fan status earned. You get access 1 week before the public sale.":"You are in. Build your score by linking Spotify and attending more shows."}
          </p>
          <button onClick={() => { onComplete(finalScore); onClose(); reset(); }} style={{width:"100%",background:T.gold,border:"none",borderRadius:14,padding:"14px 0",fontWeight:800,fontSize:15,color:T.bg,cursor:"pointer"}}>
            Save My Score
          </button>
          <button onClick={reset} style={{width:"100%",background:"transparent",border:"none",color:T.muted,fontSize:13,cursor:"pointer",marginTop:10,padding:"8px 0"}}>Retake quiz</button>
        </div>
      )}
    </Modal>
  );
}

function VerifyModal({open,onClose,onVerified}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({firstName:"",lastName:"",dob:"",idType:"passport",idNumber:""});
  const [loading, setLoading] = useState(false);

  function submit() {
    if (!form.firstName || !form.lastName || !form.dob || !form.idNumber) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 1800);
  }

  function finish() { onVerified(); onClose(); setStep(0); setForm({firstName:"",lastName:"",dob:"",idType:"passport",idNumber:""}); }

  return (
    <Modal open={open} onClose={onClose}>
      {step===0 && (
        <>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:40,marginBottom:12}}>ID</div>
            <h3 style={{fontSize:18,fontWeight:800,color:T.text,margin:"0 0 8px"}}>Verify Your Identity</h3>
            <p style={{color:T.muted,fontSize:13,lineHeight:1.6,margin:0}}>Required to purchase tickets. Your details are encrypted and never shared.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,margin:"20px 0"}}>
            {[["Lock","End-to-end encrypted"],["Eye","Never sold or shared"],["Check","One-time verification"]].map(([icon,text]) => (
              <div key={text} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:T.surface,border:"1px solid "+T.border,borderRadius:10}}>
                <span style={{fontSize:13,color:T.muted}}>{text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)} style={{width:"100%",background:T.gold,border:"none",borderRadius:14,padding:"14px 0",fontWeight:800,fontSize:15,color:T.bg,cursor:"pointer"}}>Start Verification</button>
        </>
      )}
      {step===1 && (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <button onClick={() => setStep(0)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14}}>Back</button>
            <div style={{fontSize:12,color:T.muted}}>Step 2 of 2</div>
          </div>
          <h3 style={{fontSize:16,fontWeight:800,color:T.text,margin:"0 0 18px"}}>Your Details</h3>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><Input label="First Name" value={form.firstName} onChange={v => setForm(f => ({...f,firstName:v}))} placeholder="John"/></div>
            <div style={{flex:1}}><Input label="Last Name" value={form.lastName} onChange={v => setForm(f => ({...f,lastName:v}))} placeholder="Smith"/></div>
          </div>
          <Input label="Date of Birth" value={form.dob} onChange={v => setForm(f => ({...f,dob:v}))} placeholder="DD/MM/YYYY"/>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:T.muted,marginBottom:6,fontWeight:600}}>ID Type</div>
            <div style={{display:"flex",gap:8}}>
              {["passport","driving licence","national id"].map(t => (
                <button key={t} onClick={() => setForm(f => ({...f,idType:t}))} style={{flex:1,background:form.idType===t?T.gold+"22":T.surface,border:"1px solid "+(form.idType===t?T.gold:T.border),borderRadius:9,padding:"8px 4px",color:form.idType===t?T.gold:T.muted,fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Input label="ID Number" value={form.idNumber} onChange={v => setForm(f => ({...f,idNumber:v}))} placeholder="e.g. 123456789"/>
          <button onClick={submit} disabled={loading} style={{width:"100%",background:loading?T.border:T.gold,border:"none",borderRadius:14,padding:"14px 0",fontWeight:800,fontSize:15,color:loading?T.muted:T.bg,cursor:loading?"not-allowed":"pointer"}}>
            {loading?"Verifying...":"Submit"}
          </button>
        </>
      )}
      {step===2 && (
        <div style={{textAlign:"center",padding:"8px 0"}}>
          <div style={{fontSize:52,marginBottom:14}}>OK</div>
          <h3 style={{fontSize:20,fontWeight:800,color:T.green,margin:"0 0 8px"}}>Identity Verified</h3>
          <p style={{color:T.muted,fontSize:14,lineHeight:1.6,margin:"0 0 24px"}}>You can now purchase tickets. Your tickets will be named and require ID at the door.</p>
          <button onClick={finish} style={{width:"100%",background:T.gold,border:"none",borderRadius:14,padding:"14px 0",fontWeight:800,fontSize:15,color:T.bg,cursor:"pointer"}}>Done</button>
        </div>
      )}
    </Modal>
  );
}

function EditProfileModal({open,onClose,displayName,bio,location,onSave}) {
  const [name, setName] = useState(displayName);
  const [b, setB] = useState(bio);
  const [loc, setLoc] = useState(location);
  useEffect(() => { setName(displayName); setB(bio); setLoc(location); }, [displayName,bio,location,open]);
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{margin:0,fontSize:18,fontWeight:800,color:T.text}}>Edit Profile</h3>
        <button onClick={onClose} style={{background:T.border,border:"none",color:T.muted,borderRadius:99,width:28,height:28,cursor:"pointer",fontSize:13}}>x</button>
      </div>
      <Input label="Display Name" value={name} onChange={setName} placeholder="Your name"/>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,color:T.muted,marginBottom:6,fontWeight:600}}>Bio</div>
        <textarea value={b} onChange={e => setB(e.target.value)} placeholder="Tell fans about yourself..." rows={3}
          style={{width:"100%",background:T.surface,border:"1px solid "+T.border,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,outline:"none",boxSizing:"border-box",resize:"none",fontFamily:"inherit"}}
          onFocus={e => e.target.style.borderColor=T.gold} onBlur={e => e.target.style.borderColor=T.border}/>
      </div>
      <Input label="Location" value={loc} onChange={setLoc} placeholder="e.g. London, UK"/>
      <button onClick={() => { onSave(name,b,loc); onClose(); }} style={{width:"100%",background:T.gold,border:"none",borderRadius:14,padding:"14px 0",fontWeight:800,fontSize:15,color:T.bg,cursor:"pointer"}}>
        Save Changes
      </button>
    </Modal>
  );
}

function ConcertDetailModal({concert,open,onClose,userTier,waitlisted,onWaitlist,onBuy}) {
  if (!concert) return null;
  const soldPct = Math.round(((concert.totalTickets-concert.remaining)/concert.totalTickets)*100);
  const almostGone = concert.remaining < 300;
  return (
    <Modal open={open} onClose={onClose} noPad>
      <div style={{position:"relative",height:200}}>
        <img src={concert.img} alt={concert.artist} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,"+T.card+" 0%,transparent 60%)"}}/>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"#00000066",border:"none",color:"#fff",borderRadius:99,width:30,height:30,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>x</button>
        <div style={{position:"absolute",bottom:14,left:16}}>
          <div style={{fontSize:22,fontWeight:900,color:"#fff"}}>{concert.artist}</div>
          <div style={{fontSize:12,color:"#ffffff88"}}>{concert.genre}</div>
        </div>
        <div style={{position:"absolute",top:14,left:14,background:T.gold,borderRadius:99,padding:"4px 12px",fontSize:13,color:T.bg,fontWeight:800}}>£{concert.price}</div>
      </div>
      <div style={{padding:"20px 20px 36px"}}>
        <p style={{color:T.muted,fontSize:13,lineHeight:1.7,margin:"0 0 18px"}}>{concert.description}</p>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
          <div style={{fontSize:13,color:T.muted}}>📍 {concert.venue}</div>
          <div style={{fontSize:13,color:T.muted}}>📅 {concert.date} at {concert.time}</div>
          <div style={{fontSize:13,color:T.muted}}>🎟 {concert.remaining} tickets remaining</div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:11,color:T.muted}}>Availability</span>
            {almostGone && <span style={{fontSize:11,color:T.red,fontWeight:700}}>Almost gone</span>}
          </div>
          <div style={{background:T.border,borderRadius:99,height:5}}>
            <div style={{width:soldPct+"%",background:almostGone?T.red:T.gold,height:"100%",borderRadius:99}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
          {[{l:"Tier 1",d:concert.tier1Opens,c:T.gold},{l:"Tier 2",d:concert.tier2Opens,c:T.violet},{l:"Public",d:concert.publicOpens,c:T.teal}].map(w => (
            <div key={w.l} style={{background:w.c+"12",border:"1px solid "+w.c+"33",borderRadius:8,padding:"5px 10px"}}>
              <span style={{color:w.c,fontWeight:700,fontSize:11}}>{w.l}</span>
              <span style={{color:T.muted,fontSize:11,marginLeft:5}}>{w.d}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={() => onWaitlist(concert.id)} style={{flex:1,background:waitlisted?T.violet+"22":T.surface,border:"1px solid "+(waitlisted?T.violet:T.border),borderRadius:12,padding:"12px 0",color:waitlisted?T.violet:T.muted,fontSize:13,cursor:"pointer",fontWeight:600}}>
            {waitlisted?"Waitlisted":"Join Waitlist"}
          </button>
          <button onClick={() => { onBuy(concert); onClose(); }} style={{flex:2,background:userTier<=2?T.gold:T.surface,border:"none",borderRadius:12,padding:"12px 0",color:userTier<=2?T.bg:T.muted,fontSize:14,cursor:userTier<=2?"pointer":"not-allowed",fontWeight:700}}>
            {userTier<=2?"Get Early Access":"Score too low"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConcertCard({concert,userTier,onBuy,onExpand,waitlisted,onWaitlist}) {
  const soldPct = Math.round(((concert.totalTickets-concert.remaining)/concert.totalTickets)*100);
  const almostGone = concert.remaining < 300;
  const unlocked = userTier <= 2;
  return (
    <div style={{background:T.card,border:"1px solid "+T.border,borderRadius:20,overflow:"hidden",marginBottom:14,cursor:"pointer",transition:"transform 0.2s,border-color 0.2s"}}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor=T.borderHi; }}
      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor=T.border; }}
      onClick={() => onExpand(concert)}>
      <div style={{position:"relative",height:160,overflow:"hidden"}}>
        <img src={concert.img} alt={concert.artist} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,"+T.card+" 0%,"+concert.accent+"44 50%,transparent 100%)"}}/>
        <div style={{position:"absolute",top:12,left:12,background:"#00000066",backdropFilter:"blur(8px)",borderRadius:99,padding:"4px 10px",fontSize:11,color:"#ffffff99",fontWeight:600}}>{concert.genre}</div>
        <div style={{position:"absolute",top:12,right:12,background:T.gold,borderRadius:99,padding:"4px 12px",fontSize:13,color:T.bg,fontWeight:800}}>£{concert.price}</div>
        {almostGone && <div style={{position:"absolute",bottom:12,right:12,background:T.red+"dd",borderRadius:99,padding:"3px 10px",fontSize:11,color:"#fff",fontWeight:700}}>Almost Gone</div>}
        <div style={{position:"absolute",bottom:12,left:14,fontSize:20,fontWeight:900,color:"#fff",textShadow:"0 2px 8px #00000088"}}>{concert.artist}</div>
      </div>
      <div style={{padding:"14px 16px 16px"}}>
        <div style={{fontSize:12,color:T.muted,marginBottom:2}}>📍 {concert.venue}</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:10}}>📅 {concert.date} at {concert.time}</div>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:11,color:T.muted}}>Availability</span>
            <span style={{fontSize:11,color:almostGone?T.red:T.muted}}>{concert.remaining} remaining</span>
          </div>
          <div style={{background:T.border,borderRadius:99,height:4}}>
            <div style={{width:soldPct+"%",height:"100%",borderRadius:99,background:almostGone?T.red:T.gold}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {[{l:"Tier 1",d:concert.tier1Opens,c:T.gold},{l:"Tier 2",d:concert.tier2Opens,c:T.violet},{l:"Public",d:concert.publicOpens,c:T.teal}].map(w => (
            <div key={w.l} style={{background:w.c+"12",border:"1px solid "+w.c+"33",borderRadius:8,padding:"4px 8px"}}>
              <span style={{color:w.c,fontWeight:700,fontSize:10}}>{w.l}</span>
              <span style={{color:T.muted,marginLeft:4,fontSize:10}}>{w.d}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}} onClick={e => e.stopPropagation()}>
          <button onClick={() => onWaitlist(concert.id)} style={{background:waitlisted?T.violet+"22":T.surface,border:"1px solid "+(waitlisted?T.violet:T.border),borderRadius:10,padding:"10px 14px",color:waitlisted?T.violet:T.muted,fontSize:13,cursor:"pointer",fontWeight:600,flexShrink:0}}>
            {waitlisted?"★":"☆"}
          </button>
          <button onClick={() => onBuy(concert)} style={{flex:1,background:unlocked?T.gold:T.surface,color:unlocked?T.bg:T.muted,border:unlocked?"none":"1px solid "+T.border,borderRadius:10,padding:"10px 0",fontWeight:700,fontSize:13,cursor:unlocked?"pointer":"not-allowed"}}>
            {unlocked?"Get Early Access":"Build Score to Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BuyModal({concert,open,onClose,userTier,verified,onVerify,onSuccess}) {
  const [qty, setQty] = useState(1);
  const [purchased, setPurchased] = useState(false);
  useEffect(() => { if (open) { setQty(1); setPurchased(false); } }, [open]);
  if (!concert) return null;

  function confirm() {
    if (!verified) { onVerify(); onClose(); return; }
    setPurchased(true);
    onSuccess(concert, qty);
  }

  return (
    <Modal open={open} onClose={onClose} noPad>
      <div style={{position:"relative",height:140}}>
        <img src={concert.img} alt={concert.artist} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#16161F 0%,transparent 60%)"}}/>
        <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"#00000066",border:"none",color:"#fff",borderRadius:99,width:30,height:30,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>x</button>
        <div style={{position:"absolute",bottom:12,left:16}}>
          <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{concert.artist}</div>
          <div style={{fontSize:12,color:"#ffffff88"}}>{concert.venue}</div>
        </div>
      </div>
      <div style={{padding:"20px 20px 36px"}}>
        {!purchased ? (
          <>
            {!verified && <div style={{background:T.red+"18",border:"1px solid "+T.red+"44",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:12,color:T.red}}>You need to verify your identity before purchasing.</div>}
            <TierBadge tier={userTier}/>
            <p style={{color:T.muted,fontSize:13,margin:"10px 0 16px"}}>Max 2 tickets per verified identity.</p>
            <div style={{background:T.surface,borderRadius:14,padding:16,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{color:T.muted,fontSize:13}}>Price per ticket</span>
                <span style={{fontWeight:700}}>£{concert.price}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{color:T.muted,fontSize:13}}>Quantity</span>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <button onClick={() => setQty(q => Math.max(1,q-1))} style={{background:T.border,border:"none",color:T.text,borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
                  <span style={{fontWeight:700,minWidth:16,textAlign:"center"}}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(2,q+1))} style={{background:T.border,border:"none",color:T.text,borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
              </div>
              <div style={{borderTop:"1px solid "+T.border,paddingTop:12,display:"flex",justifyContent:"space-between"}}>
                <span style={{fontWeight:700}}>Total</span>
                <span style={{fontWeight:800,color:T.gold,fontSize:16}}>£{concert.price*qty}</span>
              </div>
            </div>
            <div style={{fontSize:11,color:T.muted,marginBottom:14,lineHeight:1.6}}>Named and non-transferable. ID checked at door. Issued 48hrs before show.</div>
            <button onClick={confirm} style={{width:"100%",background:T.gold,border:"none",borderRadius:14,padding:"15px 0",fontWeight:800,fontSize:15,color:T.bg,cursor:"pointer"}}>
              {verified ? "Confirm £"+concert.price*qty : "Verify Identity to Purchase"}
            </button>
          </>
        ) : (
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontSize:52,marginBottom:14}}>🎉</div>
            <h2 style={{color:T.gold,margin:"0 0 8px",fontSize:22}}>You are going!</h2>
            <p style={{color:T.muted,fontSize:14,lineHeight:1.6}}>{qty} x {concert.artist} ticket{qty>1?"s":""} confirmed. Your named ticket arrives 48hrs before the show.</p>
            <button onClick={onClose} style={{marginTop:20,background:T.gold,border:"none",borderRadius:14,padding:"13px 36px",fontWeight:700,fontSize:14,color:T.bg,cursor:"pointer"}}>Done</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
function SettingsDrawer({open,onClose,user,localPhoto,onPhotoChange,onSignOut,spotifyLinked,setSpotifyLinked,appleLinked,setAppleLinked,notifications,setNotifications,emailAlerts,setEmailAlerts,earlyAccess,setEarlyAccess,score,userTier,showToast}) {
  const fileRef = useRef();
  const name = user?.firstName ? (user.firstName+" "+(user.lastName||"")).trim() : (user?.emailAddresses?.[0]?.emailAddress||"Fan");
  const email = user?.emailAddresses?.[0]?.emailAddress||"";
  const imgSrc = localPhoto || user?.imageUrl;
  const initials = user?.firstName?.[0] || email?.[0]?.toUpperCase() || "F";

  function SLabel({t}) {
    return <div style={{fontSize:10,color:T.muted,letterSpacing:1.8,fontWeight:700,textTransform:"uppercase",padding:"16px 20px 6px"}}>{t}</div>;
  }

  function Row({icon,label,sublabel,right,onClick,danger,tag}) {
    return (
      <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:13,padding:"12px 20px",cursor:onClick?"pointer":"default",transition:"background 0.15s",borderBottom:"1px solid "+T.border}}
        onMouseEnter={e => onClick && (e.currentTarget.style.background=T.surface)}
        onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
        <div style={{width:34,height:34,borderRadius:9,background:danger?T.red+"18":T.surface,border:"1px solid "+T.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:14,color:danger?T.red:T.text,fontWeight:500}}>{label}</span>
            {tag && <span style={{fontSize:9,background:T.gold+"18",color:T.gold,border:"1px solid "+T.gold+"44",borderRadius:99,padding:"1px 7px",fontWeight:700}}>{tag}</span>}
          </div>
          {sublabel && <div style={{fontSize:11,color:T.muted,marginTop:1}}>{sublabel}</div>}
        </div>
        {right || (onClick && !danger && <span style={{color:T.subtle,fontSize:17}}>›</span>)}
      </div>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"#00000088",zIndex:200,opacity:open?1:0,pointerEvents:open?"all":"none",transition:"opacity 0.25s",backdropFilter:"blur(8px)"}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:"88%",maxWidth:360,background:T.surface,zIndex:201,transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",overflowY:"auto",borderLeft:"1px solid "+T.border}}>
        <div style={{background:"linear-gradient(160deg,"+T.card+" 0%,#1A1020 100%)",padding:"52px 20px 24px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:T.border,border:"none",color:T.muted,borderRadius:99,width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>x</button>
          <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
            <div style={{width:72,height:72,borderRadius:99,border:"2.5px solid "+T.gold,overflow:"hidden",background:T.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:T.gold}}>
              {imgSrc ? <img src={imgSrc} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : initials}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{position:"absolute",bottom:0,right:0,background:T.gold,border:"2px solid "+T.surface,borderRadius:99,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,cursor:"pointer"}}>📷</button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
              onChange={e => { const f=e.target.files?.[0]; if(f){ onPhotoChange(URL.createObjectURL(f)); showToast("Photo updated","success"); }}}/>
          </div>
          <div style={{fontSize:18,fontWeight:800,color:T.text}}>{name}</div>
          <div style={{fontSize:12,color:T.muted,margin:"2px 0 12px"}}>{email}</div>
          <TierBadge tier={userTier}/>
        </div>

        <div style={{margin:"12px 14px",background:T.card,border:"1px solid "+T.border,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{position:"relative",flexShrink:0}}>
            <ScoreRing score={score} size={50} animated/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:13,fontWeight:900,color:T.gold}}>{score}</span>
            </div>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>Fan Score</div>
            {!spotifyLinked && <div style={{fontSize:11,color:T.muted,marginTop:2}}>Link Spotify to earn <span style={{color:T.gold}}>+18 pts</span></div>}
            {spotifyLinked && <div style={{fontSize:11,color:"#1DB954",marginTop:2}}>Spotify connected</div>}
          </div>
        </div>

        <div style={{paddingBottom:40}}>
          <SLabel t="Connect Music"/>
          <Row icon="🟢" label="Spotify" sublabel={spotifyLinked?"Connected — streaming score active":"Not connected"} right={<Toggle value={spotifyLinked} onChange={v => { setSpotifyLinked(v); showToast(v?"Spotify connected":"Spotify disconnected","success"); }}/>}/>
          <Row icon="🎵" label="Apple Music" sublabel={appleLinked?"Connected":"Not connected"} right={<Toggle value={appleLinked} onChange={v => { setAppleLinked(v); showToast(v?"Apple Music connected":"Apple Music disconnected","success"); }}/>}/>
          <SLabel t="Notifications"/>
          <Row icon="🔔" label="Push Notifications" right={<Toggle value={notifications} onChange={v => { setNotifications(v); showToast(v?"Push on":"Push off"); }}/>}/>
          <Row icon="📩" label="Email Alerts" right={<Toggle value={emailAlerts} onChange={v => { setEmailAlerts(v); showToast(v?"Email alerts on":"Email alerts off"); }}/>}/>
          <Row icon="🎟" label="Early Access Alerts" sublabel="Get notified when your window opens" right={<Toggle value={earlyAccess} onChange={v => { setEarlyAccess(v); showToast(v?"Early access alerts on":"Early access alerts off"); }}/>}/>
          <SLabel t="Account"/>
          <Row icon="🪪" label="Verify Identity" sublabel="Required for ticket purchases" tag="REQUIRED" onClick={() => { onClose(); showToast("Opening verification..."); }}/>
          <Row icon="📜" label="Terms and Privacy Policy" onClick={() => showToast("Opening terms...")}/>
          <Row icon="❓" label="Help Centre" onClick={() => showToast("Opening help centre...")}/>
          <Row icon="💬" label="Contact Support" sublabel="Usually replies within 2 hours" onClick={() => showToast("Opening support...")}/>
          <SLabel t=""/>
          <Row icon="🚪" label="Sign Out" danger onClick={onSignOut}/>
          <p style={{textAlign:"center",color:T.subtle,fontSize:11,margin:"24px 0 0",letterSpacing:0.5}}>FanFirst v1.0 — Built for fans</p>
        </div>
      </div>
    </>
  );
}

function MainApp() {
  const {signOut} = useClerk();
  const {user} = useUser();
  const {toasts, show: showToast} = useToast();

  const [tab, setTab] = useState("discover");
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [verified, setVerified] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [spotifyLinked, setSpotifyLinked] = useState(false);
  const [appleLinked, setAppleLinked] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [earlyAccess, setEarlyAccess] = useState(true);
  const [waitlists, setWaitlists] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [buying, setBuying] = useState(null);
  const [expandConcert, setExpandConcert] = useState(null);

  const bonusScore = (spotifyLinked?18:0)+(appleLinked?8:0)+(verified?5:0);
  const totalScore = Math.min(score+bonusScore, 100);
  const userTier = getTier(totalScore);
  const imgSrc = localPhoto || user?.imageUrl;
  const initials = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "F";
  const name = displayName || (user?.firstName ? (user.firstName+" "+(user.lastName||"")).trim() : user?.emailAddresses?.[0]?.emailAddress || "Fan");

  useEffect(() => {
    if (user?.firstName) setDisplayName((user.firstName+" "+(user.lastName||"")).trim());
  }, [user]);

  const filteredConcerts = CONCERTS_DATA.filter(c => {
    const ms = c.artist.toLowerCase().includes(search.toLowerCase()) || c.venue.toLowerCase().includes(search.toLowerCase());
    const mg = genreFilter==="All" || c.genre===genreFilter;
    return ms && mg;
  });

  function toggleWaitlist(id) {
    const concert = CONCERTS_DATA.find(c => c.id===id);
    if (waitlists.find(w => w.id===id)) {
      setWaitlists(w => w.filter(x => x.id!==id));
      showToast("Removed from "+concert?.artist+" waitlist");
    } else {
      setWaitlists(w => [...w, {id, artist:concert?.artist, venue:concert?.venue, date:concert?.date, position:Math.floor(Math.random()*200)+10}]);
      showToast("Added to "+concert?.artist+" waitlist","success");
    }
  }

  function handleTicketSuccess(concert, qty) {
    const newTickets = Array.from({length:qty}, (_,i) => ({
      id: Date.now()+i,
      artist: concert.artist,
      venue: concert.venue,
      date: concert.date,
      time: concert.time,
      img: concert.img,
      seat: "Block "+String.fromCharCode(65+Math.floor(Math.random()*6))+", Row "+(Math.floor(Math.random()*20)+1)+", Seat "+(Math.floor(Math.random()*30)+1),
      price: concert.price,
    }));
    setMyTickets(t => [...t, ...newTickets]);
    showToast(qty+" ticket"+(qty>1?"s":"")+" confirmed for "+concert.artist,"success");
  }

  const tabs = [{id:"discover",label:"Discover",icon:"♪"},{id:"profile",label:"Profile",icon:"◉"},{id:"tickets",label:"Tickets",icon:"◈"}];

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif",background:T.bg,minHeight:"100vh",color:T.text,maxWidth:480,margin:"0 auto",paddingBottom:80}}>
      <Toast toasts={toasts}/>

      <div style={{background:T.surface,borderBottom:"1px solid "+T.border,padding:"16px 18px 14px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Logo size={24}/>
          <button onClick={() => setDrawerOpen(true)} style={{width:38,height:38,borderRadius:99,border:"2px solid "+T.gold,background:T.border,overflow:"hidden",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:T.gold,position:"relative",flexShrink:0}}>
            {imgSrc ? <img src={imgSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : initials}
            <div style={{position:"absolute",bottom:0,right:0,width:9,height:9,background:T.green,borderRadius:99,border:"2px solid "+T.bg}}/>
          </button>
        </div>
        <h1 style={{margin:"10px 0 0",fontSize:22,fontWeight:900,color:T.text,letterSpacing:-0.5}}>
          {tab==="discover"&&"Upcoming Shows"}
          {tab==="profile"&&"Fan Profile"}
          {tab==="tickets"&&"My Tickets"}
        </h1>
      </div>

      <div style={{padding:"18px 14px"}}>
        {tab==="discover" && (
          <>
            {!quizDone ? (
              <div style={{background:"linear-gradient(135deg,"+T.card+" 0%,#1A0F28 100%)",border:"1px solid "+T.borderHi,borderRadius:18,padding:"18px",marginBottom:18}}>
                <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:6}}>What is your Fan Score?</div>
                <p style={{fontSize:13,color:T.muted,margin:"0 0 14px",lineHeight:1.6}}>Take a 2-minute quiz to unlock your tier and get early access.</p>
                <button onClick={() => setQuizOpen(true)} style={{background:T.gold,border:"none",borderRadius:10,padding:"11px 20px",fontWeight:700,fontSize:14,color:T.bg,cursor:"pointer"}}>Take the Quiz</button>
              </div>
            ) : (
              <div style={{background:"linear-gradient(135deg,"+T.card+" 0%,#1A0F28 100%)",border:"1px solid "+T.borderHi,borderRadius:18,padding:"16px 18px",display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <ScoreRing score={totalScore} size={60} animated/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:15,fontWeight:900,color:T.gold}}>{totalScore}</span>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:12,color:T.muted,marginBottom:5}}>Hey {user?.firstName||"there"}</div>
                  <TierBadge tier={userTier}/>
                  <div style={{fontSize:12,color:T.muted,marginTop:6}}>Early access opens <span style={{color:T.violet,fontWeight:600}}>{userTier===1?"2 weeks":userTier===2?"1 week":"3 days"} early</span></div>
                </div>
                <button onClick={() => setQuizOpen(true)} style={{marginLeft:"auto",background:"none",border:"1px solid "+T.border,borderRadius:8,padding:"6px 10px",color:T.muted,fontSize:11,cursor:"pointer",flexShrink:0}}>Retake</button>
              </div>
            )}

            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search artists or venues..."
              style={{width:"100%",background:T.card,border:"1px solid "+T.border,borderRadius:12,padding:"11px 16px",color:T.text,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12}}
              onFocus={e => e.target.style.borderColor=T.gold}
              onBlur={e => e.target.style.borderColor=T.border}/>

            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:18}}>
              {GENRES.map(g => (
                <button key={g} onClick={() => setGenreFilter(g)} style={{background:genreFilter===g?T.gold:T.card,color:genreFilter===g?T.bg:T.muted,border:"1px solid "+(genreFilter===g?T.gold:T.border),borderRadius:99,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                  {g}
                </button>
              ))}
            </div>

            {filteredConcerts.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}>
                <div style={{fontSize:40,marginBottom:12}}>🔍</div>
                <div style={{fontSize:16,fontWeight:600,color:T.text,marginBottom:8}}>No shows found</div>
                <button onClick={() => { setSearch(""); setGenreFilter("All"); }} style={{background:T.gold,border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,color:T.bg,cursor:"pointer"}}>Clear filters</button>
              </div>
            ) : filteredConcerts.map(c => (
              <ConcertCard key={c.id} concert={c} userTier={userTier}
                onBuy={c => setBuying(c)}
                onExpand={setExpandConcert}
                waitlisted={!!waitlists.find(w => w.id===c.id)}
                onWaitlist={toggleWaitlist}/>
            ))}
          </>
        )}

        {tab==="profile" && (
          <>
            <div style={{background:T.card,border:"1px solid "+T.border,borderRadius:20,padding:20,marginBottom:14,textAlign:"center"}}>
              <button onClick={() => setDrawerOpen(true)} style={{width:88,height:88,borderRadius:99,border:"3px solid "+T.gold,background:T.border,overflow:"hidden",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:800,color:T.gold,margin:"0 auto 4px"}}>
                {imgSrc ? <img src={imgSrc} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : initials}
              </button>
              <div style={{fontSize:11,color:T.gold,marginBottom:12,cursor:"pointer"}} onClick={() => setEditOpen(true)}>Edit profile</div>
              <div style={{position:"relative",display:"inline-block"}}>
                <ScoreRing score={totalScore} size={96} animated/>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:24,fontWeight:900,color:T.gold}}>{totalScore}</span>
                  <span style={{fontSize:10,color:T.muted}}>/ 100</span>
                </div>
              </div>
              <h2 style={{margin:"12px 0 6px",color:T.text,fontWeight:800}}>{name}</h2>
              {bio && <p style={{color:T.muted,fontSize:13,margin:"0 0 8px"}}>{bio}</p>}
              {location && <p style={{color:T.muted,fontSize:12,margin:"0 0 10px"}}>📍 {location}</p>}
              <TierBadge tier={userTier}/>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:10,flexWrap:"wrap"}}>
                {verified && <span style={{fontSize:11,color:T.green}}>✓ ID Verified</span>}
                {spotifyLinked && <span style={{fontSize:11,color:"#1DB954"}}>🟢 Spotify</span>}
                {appleLinked && <span style={{fontSize:11,color:T.muted}}>🎵 Apple Music</span>}
              </div>
            </div>

            <div style={{background:T.card,border:"1px solid "+T.border,borderRadius:20,padding:20,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>Score Breakdown</div>
                <button onClick={() => setQuizOpen(true)} style={{background:T.gold+"22",border:"1px solid "+T.gold+"44",color:T.gold,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  {quizDone?"Retake":"Take Quiz"}
                </button>
              </div>
              <ProgressBar value={Math.round(totalScore*0.42)} max={50} label="🎵 Streaming history" color={T.gold}/>
              <ProgressBar value={Math.round(totalScore*0.26)} max={30} label="🎪 Past attendance" color={T.violet}/>
              <ProgressBar value={Math.round(totalScore*0.18)} max={20} label="👕 Merch purchases" color={T.teal}/>
              <ProgressBar value={Math.round(totalScore*0.14)} max={15} label="📱 Social engagement" color="#FF9F7F"/>
              {bonusScore>0 && (
                <div style={{marginTop:12,padding:"10px 12px",background:T.green+"11",border:"1px solid "+T.green+"33",borderRadius:10,fontSize:12,color:T.green}}>
                  +{bonusScore} bonus pts from connected services
                </div>
              )}
              {!spotifyLinked && (
                <div onClick={() => setDrawerOpen(true)} style={{marginTop:12,padding:"11px 14px",background:T.surface,border:"1px solid "+T.border,borderRadius:12,fontSize:12,color:T.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span>Link Spotify to earn <strong style={{color:T.gold}}>+18 pts</strong></span>
                  <span style={{color:T.gold,fontSize:12}}>Connect</span>
                </div>
              )}
            </div>

            <div style={{background:T.card,border:"1px solid "+T.border,borderRadius:20,padding:20,marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:14}}>Access Level</div>
              {[{tier:1,req:"Score 70+",col:T.gold},{tier:2,req:"Score 40+",col:T.violet},{tier:3,req:"Any score",col:T.teal}].map(w => {
                const active = userTier<=w.tier;
                return (
                  <div key={w.tier} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:w.tier<3?"1px solid "+T.border:"none"}}>
                    <div style={{width:36,height:36,borderRadius:99,background:active?w.col+"22":T.surface,border:"2px solid "+(active?w.col:T.border),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
                      {active?"✓":"🔒"}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:active?w.col:T.muted}}>{getTierLabel(w.tier)}</div>
                      <div style={{fontSize:11,color:T.muted}}>{w.req}</div>
                    </div>
                    {userTier===w.tier && <span style={{fontSize:10,background:w.col+"22",color:w.col,border:"1px solid "+w.col+"44",borderRadius:99,padding:"2px 8px",fontWeight:700}}>YOUR TIER</span>}
                  </div>
                );
              })}
            </div>

            {!verified && (
              <button onClick={() => setVerifyOpen(true)} style={{width:"100%",background:T.red+"18",border:"1px solid "+T.red+"44",borderRadius:14,padding:"13px 0",color:T.red,fontSize:14,cursor:"pointer",fontWeight:700,marginBottom:10}}>
                Verify Identity to Purchase Tickets
              </button>
            )}
            <button onClick={() => setDrawerOpen(true)} style={{width:"100%",background:T.card,border:"1px solid "+T.border,borderRadius:14,padding:"13px 0",color:T.text,fontSize:14,cursor:"pointer",fontWeight:600}}>
              Account Settings
            </button>
          </>
        )}

        {tab==="tickets" && (
          <>
            {myTickets.length===0 && waitlists.length===0 ? (
              <div style={{textAlign:"center",padding:"80px 20px",color:T.muted}}>
                <div style={{fontSize:52,marginBottom:16}}>🎟</div>
                <div style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:8}}>No tickets yet</div>
                <p style={{fontSize:13,lineHeight:1.6,margin:"0 0 20px"}}>Discover shows and use your Fan Score to get early access.</p>
                <button onClick={() => setTab("discover")} style={{background:T.gold,border:"none",borderRadius:12,padding:"11px 24px",fontWeight:700,fontSize:14,color:T.bg,cursor:"pointer"}}>Browse Shows</button>
              </div>
            ) : (
              <>
                {myTickets.length>0 && (
                  <>
                    <div style={{fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Your Tickets ({myTickets.length})</div>
                    {myTickets.map(t => (
                      <div key={t.id} style={{background:T.card,border:"1px solid "+T.border,borderRadius:20,overflow:"hidden",marginBottom:14}}>
                        <div style={{position:"relative",height:120}}>
                          <img src={t.img} alt={t.artist} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#16161F 0%,transparent 60%)"}}/>
                          <div style={{position:"absolute",bottom:12,left:14,fontSize:18,fontWeight:900,color:"#fff"}}>{t.artist}</div>
                          <div style={{position:"absolute",top:12,right:12,background:T.green+"22",border:"1px solid "+T.green+"66",color:T.green,borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:700}}>Confirmed</div>
                        </div>
                        <div style={{padding:"14px 16px 16px"}}>
                          <div style={{fontSize:12,color:T.muted,marginBottom:2}}>📍 {t.venue}</div>
                          <div style={{fontSize:12,color:T.muted,marginBottom:2}}>📅 {t.date} at {t.time}</div>
                          <div style={{fontSize:12,color:T.violet,fontWeight:600,marginBottom:12}}>🪑 {t.seat}</div>
                          <div style={{background:T.surface,borderRadius:10,padding:"10px 12px",fontSize:11,color:T.muted,lineHeight:1.6,marginBottom:12}}>
                            Named ticket. ID required at door. Issued 48hrs before show.
                          </div>
                          <button onClick={() => showToast("Transfer request submitted","success")} style={{width:"100%",background:"transparent",border:"1px solid "+T.border,borderRadius:10,padding:"9px 0",color:T.muted,fontSize:13,cursor:"pointer"}}>
                            Request Transfer
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {waitlists.length>0 && (
                  <>
                    <div style={{fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Waitlists ({waitlists.length})</div>
                    {waitlists.map(w => (
                      <div key={w.id} style={{background:T.card,border:"1px solid "+T.border,borderRadius:16,padding:16,marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,color:T.text}}>{w.artist}</div>
                            <div style={{fontSize:12,color:T.muted,marginTop:2}}>{w.venue}</div>
                            <div style={{fontSize:12,color:T.muted}}>{w.date}</div>
                          </div>
                          <div style={{background:T.violet+"22",border:"1px solid "+T.violet+"44",borderRadius:10,padding:"6px 12px",textAlign:"center"}}>
                            <div style={{fontSize:18,fontWeight:900,color:T.violet}}>#{w.position}</div>
                            <div style={{fontSize:10,color:T.muted}}>in queue</div>
                          </div>
                        </div>
                        <button onClick={() => toggleWaitlist(w.id)} style={{marginTop:12,width:"100%",background:"transparent",border:"1px solid "+T.border,borderRadius:10,padding:"8px 0",color:T.red,fontSize:12,cursor:"pointer"}}>
                          Leave Waitlist
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} onComplete={s => { setScore(s); setQuizDone(true); showToast("Fan Score saved","success"); }}/>
      <VerifyModal open={verifyOpen} onClose={() => setVerifyOpen(false)} onVerified={() => { setVerified(true); showToast("Identity verified","success"); }}/>
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} displayName={name} bio={bio} location={location} onSave={(n,b,l) => { setDisplayName(n); setBio(b); setLocation(l); showToast("Profile updated","success"); }}/>
      <ConcertDetailModal concert={expandConcert} open={!!expandConcert} onClose={() => setExpandConcert(null)} userTier={userTier} waitlisted={!!waitlists.find(w => w.id===expandConcert?.id)} onWaitlist={toggleWaitlist} onBuy={c => { setExpandConcert(null); setBuying(c); }}/>
      <BuyModal concert={buying} open={!!buying} onClose={() => setBuying(null)} userTier={userTier} verified={verified} onVerify={() => { setBuying(null); setVerifyOpen(true); }} onSuccess={handleTicketSuccess}/>
      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} localPhoto={localPhoto} onPhotoChange={setLocalPhoto} onSignOut={() => { setDrawerOpen(false); signOut(); }} spotifyLinked={spotifyLinked} setSpotifyLinked={setSpotifyLinked} appleLinked={appleLinked} setAppleLinked={setAppleLinked} notifications={notifications} setNotifications={setNotifications} emailAlerts={emailAlerts} setEmailAlerts={setEmailAlerts} earlyAccess={earlyAccess} setEarlyAccess={setEarlyAccess} score={totalScore} userTier={userTier} showToast={showToast}/>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.surface,borderTop:"1px solid "+T.border,display:"flex",padding:"10px 0 22px"}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"6px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative"}}>
            {t.id==="tickets" && myTickets.length>0 && (
              <div style={{position:"absolute",top:2,right:"50%",transform:"translateX(180%)",width:16,height:16,background:T.gold,borderRadius:99,fontSize:9,color:T.bg,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{myTickets.length}</div>
            )}
            <span style={{fontSize:19,color:tab===t.id?T.gold:T.muted}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:tab===t.id?T.gold:T.muted,letterSpacing:0.5,textTransform:"uppercase"}}>{t.label}</span>
            {tab===t.id && <div style={{width:18,height:2.5,background:T.gold,borderRadius:99}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("splash");
  const [authMode, setAuthMode] = useState("sign-in");
  return (
    <>
      <SignedOut>
        {phase==="splash" && <SplashScreen onDone={() => setPhase("onboarding")}/>}
        {phase==="onboarding" && <OnboardingScreen onDone={() => setPhase("auth")}/>}
        {phase==="auth" && <AuthScreen mode={authMode} setMode={setAuthMode}/>}
      </SignedOut>
      <SignedIn><MainApp/></SignedIn>
    </>
  );
}
