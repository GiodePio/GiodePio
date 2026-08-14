'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const colors = { bg:'#050508', border:'rgba(255,255,255,0.06)', text:'#f0f0f0', textDim:'#6b6e7b', green:'#22c55e', panel:'rgba(13,13,18,0.7)' };

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
        <Item icon="📢" label="Updates" onClick={()=>nav('/dashboard/updates')}/>
        <Item icon="🏆" label="Leaderboard" active onClick={()=>{}}/>
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

export default function LeaderboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/user').then(r=>r.json()).then(d=>{ if(d.user) setUserEmail(d.user.email); });
    fetch('/api/grabs').then(r=>r.json()).then(d=>{
      const grabs = d.grabs||[];
      const counts = {};
      grabs.forEach(g=>{ const k=g.owner_email||'Unknown'; counts[k]=(counts[k]||0)+1; });
      const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([email,count],i)=>({rank:i+1,email,count}));
      setLeaders(sorted);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const medals = ['🥇','🥈','🥉'];

  return (
    <div style={{display:'flex',minHeight:'100vh',background:colors.bg,color:colors.text,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <Sidebar userEmail={userEmail} router={router}/>
      <main style={{flex:1,padding:'28px 36px',overflow:'auto'}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:700,margin:0}}>🏆 Leaderboard</h1>
          <p style={{color:colors.textDim,fontSize:13,margin:'4px 0 0'}}>{leaders.length} users ranked</p>
        </div>
        <div className="glass-card" style={{borderRadius:12,overflow:'hidden'}}>
          {loading&&<div style={{padding:60,textAlign:'center',color:colors.textDim}}>Loading...</div>}
          {!loading&&leaders.length===0&&(
            <div style={{padding:'80px 0',textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:12}}>👑</div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No ranking data yet</div>
              <div style={{fontSize:12,color:colors.textDim}}>Users with captured grabs will show up here.</div>
            </div>
          )}
          {!loading&&leaders.length>0&&(
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'rgba(255,255,255,0.03)'}}>
                  {['Rank','User','Total Captures'].map(h=>(
                    <th key={h} style={{textAlign:h==='Total Captures'?'center':'left',padding:'12px 20px',fontSize:11,color:colors.textDim,textTransform:'uppercase',letterSpacing:1,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaders.map((l,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:l.email===userEmail?'rgba(34,197,94,0.04)':'transparent'}}>
                    <td style={{padding:'14px 20px',fontSize:18}}>{medals[i]||`#${l.rank}`}</td>
                    <td style={{padding:'14px 20px',fontSize:13}}>
                      <div style={{fontWeight:600}}>{l.email?.split('@')[0]||'Unknown'}</div>
                      {l.email===userEmail&&<div style={{fontSize:10,color:colors.green}}>You</div>}
                    </td>
                    <td style={{padding:'14px 20px',textAlign:'center',fontSize:15,fontWeight:700,color:i===0?'#eab308':i===1?'#94a3b8':i===2?'#b45309':colors.text}}>{l.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
