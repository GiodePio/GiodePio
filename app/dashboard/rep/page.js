'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const colors = { bg:'#050508', border:'rgba(255,255,255,0.06)', text:'#f0f0f0', textDim:'#6b6e7b', green:'#22c55e', red:'#ef4444', panel:'rgba(13,13,18,0.7)' };

function Sidebar({ userEmail, router }) {
  const nav = (path) => router.push(path);
  const Item = ({ icon, label, active, onClick }) => (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, background: active?'rgba(34,197,94,0.08)':'transparent', color: active?colors.green:colors.textDim, fontSize:14, cursor:'pointer', marginBottom:2 }}
      onMouseEnter={e=>{ if(!active){e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.color=colors.text;} }}
      onMouseLeave={e=>{ if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color=colors.textDim;} }}>
      <span style={{fontSize:16,width:20,textAlign:'center'}}>{icon}</span><span>{label}</span>
    </div>
  );
  const Section = ({title}) => <div style={{fontSize:10,color:colors.textDim,letterSpacing:2,textTransform:'uppercase',padding:'16px 14px 6px',fontWeight:600}}>{title}</div>;
  return (
    <aside style={{width:220,borderRight:'1px solid rgba(255,255,255,0.06)',padding:'20px 12px',display:'flex',flexDirection:'column',background:'rgba(10,10,16,0.8)',backdropFilter:'blur(12px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 10px',marginBottom:28}}>
        <div style={{width:28,height:28,borderRadius:6,background:'rgba(34,197,94,0.15)'}}/><span style={{fontSize:14,fontWeight:600}}>LifeGrabber</span>
      </div>
      <div style={{flex:1}}>
        <Section title="OVERVIEW"/>
        <Item icon="📊" label="Dashboard" onClick={()=>nav('/dashboard')}/>
        <Item icon="📋" label="Plans" onClick={()=>nav('/dashboard')}/>
        <Section title="MANAGEMENT"/>
        <Item icon="⚡" label="Grabs" onClick={()=>nav('/dashboard/grabs')}/>
        <Item icon="📡" label="Live Captures" onClick={()=>nav('/dashboard/live')}/>
        <Item icon="🖥" label="Remote Control" onClick={()=>nav('/dashboard/remote-control')}/>
        <Section title="UTILITIES"/>
        <Item icon="🔨" label="Build" onClick={()=>nav('/dashboard/build')}/>
        <Section title="COMMUNITY & ACCESS"/>
        <Item icon="⭐" label="+Rep" active onClick={()=>{}}/>
        <Item icon="📢" label="Updates" onClick={()=>nav('/dashboard/updates')}/>
        <Item icon="🏆" label="Leaderboard" onClick={()=>nav('/dashboard/leaderboard')}/>
        <Section title="SYSTEM & SUPPORT"/>
        <Item icon="💬" label="Join Discord" onClick={()=>window.open('https://discord.gg/FV2668v4Zp','_blank')}/>
        <Item icon="🎫" label="Tickets" onClick={()=>nav('/dashboard/tickets')}/>
        {userEmail==='lifegrading@gmail.com'&&<Item icon="👥" label="Admin" onClick={()=>nav('/admin')}/>}
      </div>
      <div>
        <Item icon="⚙️" label="Settings" onClick={()=>nav('/dashboard/settings')}/>
        <Item icon="🚪" label="Log out" onClick={()=>window.location.href='/api/auth/logout'}/>
      </div>
    </aside>
  );
}

export default function RepPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [reps, setReps] = useState([]);
  const [filter, setFilter] = useState('newest');
  const [showCreate, setShowCreate] = useState(false);
  const [newRep, setNewRep] = useState({ type:'good', message:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetch('/api/auth/user').then(r=>r.json()).then(d=>{ if(d.user){setUserEmail(d.user.email);setUsername(d.user.name||d.user.email);}});
    fetch('/api/reps').then(r=>r.json()).then(d=>setReps(d.reps||[])).catch(()=>{});
  },[]);

  const filtered = [...reps].filter(r => {
    if(filter==='good') return r.type==='good';
    if(filter==='bad') return r.type==='bad';
    if(filter==='mine') return r.author_email===userEmail;
    return true;
  }).sort((a,b) => filter==='oldest' ? new Date(a.created_at)-new Date(b.created_at) : new Date(b.created_at)-new Date(a.created_at));

  const handleSubmit = async () => {
    if(!newRep.message.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/reps',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_email:userEmail,username:username||userEmail?.split('@')[0]||'Anonymous',tag:newRep.type==='good'?'Good':'Bad',text:newRep.message.trim()})});
      const d = await res.json();
      if(!res.ok){ setSubmitError(d.error||'Failed to post rep'); setSubmitting(false); return; }
      const d2 = await fetch('/api/reps').then(r=>r.json());
      setReps(d2.reps||[]);
      setShowCreate(false);
      setNewRep({type:'good',message:''});
    } catch(e){ setSubmitError(e.message); }
    setSubmitting(false);
  };

  const timeAgo = (ts) => {
    const diff = Date.now()-new Date(ts);
    const m=Math.floor(diff/60000),h=Math.floor(m/60),d=Math.floor(h/24);
    if(d>0) return `${d}d ago`;
    if(h>0) return `${h}h ago`;
    if(m>0) return `${m}m ago`;
    return 'just now';
  };

  const filterBtns = ['Newest','Oldest','Good','Bad','Mine'];

  return (
    <div style={{display:'flex',minHeight:'100vh',background:colors.bg,color:colors.text,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <Sidebar userEmail={userEmail} router={router}/>
      <main style={{flex:1,padding:'28px 36px',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,margin:0}}>+Rep</h1>
            <p style={{color:colors.textDim,fontSize:13,margin:'4px 0 0'}}>{reps.length} reviews from users.</p>
          </div>
          <button onClick={()=>setShowCreate(true)} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 18px',background:colors.text,color:'#000',border:'none',borderRadius:24,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            + Create Rep
          </button>
        </div>

        {/* Filters */}
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {filterBtns.map(f=>(
            <button key={f} onClick={()=>setFilter(f.toLowerCase())} style={{padding:'6px 16px',borderRadius:20,border:'1px solid rgba(255,255,255,0.12)',background:filter===f.toLowerCase()?colors.text:'transparent',color:filter===f.toLowerCase()?'#000':colors.textDim,fontSize:13,cursor:'pointer',fontWeight:filter===f.toLowerCase()?700:400}}>
              {f}
            </button>
          ))}
        </div>

        {/* Rep cards */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.length===0&&<div style={{color:colors.textDim,fontSize:13,padding:'40px 0',textAlign:'center'}}>No reviews yet.</div>}
          {filtered.map((rep,i)=>(
            <div key={i} className="glass-card" style={{borderRadius:12,padding:'16px 20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:14}}>{rep.author_name||rep.author_email?.split('@')[0]}</span>
                {rep.author_email==='lifegrading@gmail.com'&&<span style={{fontSize:10,background:'rgba(234,179,8,0.15)',color:'#eab308',padding:'2px 8px',borderRadius:10,fontWeight:700}}>👑 Owner</span>}
                <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,padding:'2px 10px',borderRadius:10,background:rep.type==='good'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)',color:rep.type==='good'?colors.green:colors.red,fontWeight:600}}>
                  {rep.type==='good'?'👍':'👎'} {rep.type==='good'?'Good':'Bad'}
                </span>
                <span style={{fontSize:11,color:colors.textDim,marginLeft:'auto'}}>{timeAgo(rep.created_at)}</span>
              </div>
              <p style={{fontSize:13,color:colors.text,margin:0,lineHeight:1.5}}>{rep.message}</p>
              {rep.owner_reply&&(
                <div style={{marginTop:12,padding:'10px 14px',background:'rgba(234,179,8,0.06)',border:'1px solid rgba(234,179,8,0.15)',borderRadius:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:11,color:'#eab308',fontWeight:700,letterSpacing:1}}>🛡 OWNER REPLY</span>
                    <span style={{fontSize:11,color:colors.textDim}}>{timeAgo(rep.reply_at||rep.created_at)}</span>
                  </div>
                  <p style={{fontSize:13,margin:0,color:colors.text}}>{rep.owner_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create Rep Modal */}
        {showCreate&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)'}}>
            <div style={{background:'#111218',border:'1px solid #2a2d38',borderRadius:16,padding:36,width:440,position:'relative'}}>
              <button onClick={()=>setShowCreate(false)} style={{position:'absolute',top:14,right:16,background:'none',border:'none',color:colors.textDim,fontSize:20,cursor:'pointer'}}>✕</button>
              <h2 style={{fontSize:18,fontWeight:700,margin:'0 0 20px'}}>Create a Rep</h2>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                {['good','bad'].map(t=>(
                  <button key={t} onClick={()=>setNewRep(p=>({...p,type:t}))} style={{flex:1,padding:'10px',borderRadius:8,border:`1px solid ${newRep.type===t?(t==='good'?colors.green:colors.red):'rgba(255,255,255,0.08)'}`,background:newRep.type===t?(t==='good'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'):'transparent',color:newRep.type===t?(t==='good'?colors.green:colors.red):colors.textDim,fontWeight:600,fontSize:13,cursor:'pointer'}}>
                    {t==='good'?'👍 Good':'👎 Bad'}
                  </button>
                ))}
              </div>
              <textarea value={newRep.message} onChange={e=>setNewRep(p=>({...p,message:e.target.value}))} placeholder="Write your review..." rows={4}
                style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'10px 14px',color:colors.text,fontSize:13,outline:'none',resize:'none',boxSizing:'border-box',marginBottom:16}}/>
              {submitError&&<div style={{color:'#ef4444',fontSize:12,marginBottom:8,padding:'6px 10px',background:'rgba(239,68,68,0.1)',borderRadius:6}}>{submitError}</div>}
              <button onClick={handleSubmit} disabled={!newRep.message.trim()||submitting}
                style={{width:'100%',padding:'12px',background:newRep.message.trim()&&!submitting?colors.green:'#333',color:'#000',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:newRep.message.trim()&&!submitting?'pointer':'not-allowed'}}>
                {submitting?'Posting...':'Post Rep'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
