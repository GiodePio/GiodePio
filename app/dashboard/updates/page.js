'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const colors = { bg:'#050508', border:'rgba(255,255,255,0.06)', text:'#f0f0f0', textDim:'#6b6e7b', green:'#22c55e', blue:'#3b82f6', panel:'rgba(13,13,18,0.7)' };

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
        <Item icon="⭐" label="+Rep" onClick={()=>nav('/dashboard/rep')}/>
        <Item icon="📢" label="Updates" active onClick={()=>{}}/>
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

const updates = [
  { version:'v1.3.0', date:'2026-08-13', tag:'New', color:'#22c55e', title:'Pro Rank System', body:'Pro rank is now fully integrated with Supabase. Admins can grant/revoke pro from the admin panel. Pro users get unlimited captures and access to all features.' },
  { version:'v1.2.0', date:'2026-08-01', tag:'Feature', color:'#3b82f6', title:'Leaderboard & +Rep', body:'Added a global leaderboard tracking all captures per user, and a community +Rep system to rate other users.' },
  { version:'v1.1.0', date:'2026-07-15', tag:'Fix', color:'#f59e0b', title:'Build & Remote Control Improvements', body:'Fixed case-sensitive email lookups in Supabase. Improved remote control stability and live capture streaming.' },
  { version:'v1.0.0', date:'2026-07-01', tag:'Launch', color:'#a855f7', title:'LifeGrabber Launched', body:'Initial launch of LifeGrabber. Profile lookups, grabs, Discord webhooks, and the mod builder are now live.' },
];

export default function UpdatesPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  useEffect(()=>{ fetch('/api/auth/user').then(r=>r.json()).then(d=>{ if(d.user) setUserEmail(d.user.email); }); },[]);

  return (
    <div style={{display:'flex',minHeight:'100vh',background:colors.bg,color:colors.text,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <Sidebar userEmail={userEmail} router={router}/>
      <main style={{flex:1,padding:'28px 36px',overflow:'auto'}}>
        <h1 style={{fontSize:22,fontWeight:700,margin:'0 0 4px'}}>📢 Updates</h1>
        <p style={{color:colors.textDim,fontSize:13,margin:'0 0 28px'}}>What's new in LifeGrabber.</p>
        <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:700}}>
          {updates.map((u,i)=>(
            <div key={i} className="glass-card" style={{borderRadius:12,padding:'20px 24px',borderLeft:`3px solid ${u.color}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <span style={{fontSize:11,background:`${u.color}20`,color:u.color,padding:'2px 10px',borderRadius:10,fontWeight:700}}>{u.tag}</span>
                <span style={{fontWeight:700,fontSize:15}}>{u.title}</span>
                <span style={{marginLeft:'auto',fontSize:11,color:colors.textDim}}>{u.version} · {u.date}</span>
              </div>
              <p style={{fontSize:13,color:'#b0b3bc',margin:0,lineHeight:1.6}}>{u.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
