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
        <Item icon="📢" label="Updates" onClick={()=>nav('/dashboard/updates')}/>
        <Item icon="🏆" label="Leaderboard" onClick={()=>nav('/dashboard/leaderboard')}/>
        <Section title="SYSTEM & SUPPORT"/>
        <Item icon="💬" label="Join Discord" onClick={()=>window.open('https://discord.gg/FV2668v4Zp','_blank')}/>
        <Item icon="🎫" label="Tickets" active onClick={()=>{}}/>
        {userEmail==='lifegrading@gmail.com'&&<Item icon="👥" label="Admin" onClick={()=>nav('/admin')}/>}
      </div>
      <div>
        <Item icon="⚙️" label="Settings" onClick={()=>nav('/dashboard/settings')}/>
        <Item icon="🚪" label="Log out" onClick={()=>window.location.href='/api/auth/logout'}/>
      </div>
    </aside>
  );
}

export default function TicketsPage() {
  const [userEmail, setUserEmail] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject:'', message:'' });
  const [submitting, setSubmitting] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/user').then(r=>r.json()).then(d=>{ if(d.user) setUserEmail(d.user.email); });
    fetch('/api/tickets').then(r=>r.json()).then(d=>{ setTickets(d.tickets || []); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  const handleCreate = async () => {
    if(!newTicket.subject.trim()||!newTicket.message.trim()) return;
    if(tickets.length>=3) return alert('Max 3 open tickets');
    setSubmitting(true);
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: newTicket.subject, messages: [{ sender:'user', text:newTicket.message, at:new Date().toISOString() }] })
    });
    if (res.ok) {
      const { ticket } = await res.json();
      setTickets(p => [ticket, ...p]);
      setSelected(ticket);
    }
    setNewTicket({subject:'',message:''});
    setShowNew(false);
    setSubmitting(false);
  };

  const handleSend = async () => {
    if(!chatMsg.trim()||!selected) return;
    const msg = {sender:'user',text:chatMsg,at:new Date().toISOString()};
    const updated = {...selected, messages:[...(selected.messages||[]),msg]};
    setSelected(updated);
    setTickets(p=>p.map(t=>t.id===selected.id?updated:t));
    setChatMsg('');
    await fetch('/api/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, message: msg })
    });
  };

  const timeAgo = (ts) => { const d=Math.floor((Date.now()-new Date(ts))/86400000); return d===0?'today':`${d}d ago`; };

  return (
    <div style={{display:'flex',minHeight:'100vh',background:colors.bg,color:colors.text,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <Sidebar userEmail={userEmail} router={router}/>
      <main style={{flex:1,padding:'28px 36px',overflow:'auto'}}>
        {/* Header */}
        <div className="glass-card" style={{borderRadius:12,padding:'20px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:42,height:42,borderRadius:10,background:'rgba(59,130,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🎫</div>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>Support &amp; Helpdesk</div>
              <div style={{fontSize:12,color:colors.textDim}}>Open a ticket to chat live with our support team (Max 3 open tickets)</div>
            </div>
          </div>
          <button onClick={()=>setShowNew(true)} disabled={tickets.length>=3}
            style={{display:'flex',alignItems:'center',gap:8,padding:'10px 18px',background:colors.text,color:'#000',border:'none',borderRadius:24,fontSize:13,fontWeight:700,cursor:tickets.length<3?'pointer':'not-allowed',opacity:tickets.length>=3?0.4:1}}>
            + New Support Ticket
          </button>
        </div>

        {/* Body */}
        <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:16,height:'calc(100vh - 220px)'}}>
          {/* Ticket list */}
          <div className="glass-card" style={{borderRadius:12,overflow:'auto'}}>
            <div style={{padding:'10px 14px',fontSize:10,color:colors.textDim,letterSpacing:2,textTransform:'uppercase',fontWeight:600,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>YOUR SUPPORT TICKETS</div>
            {loading ? <div style={{padding:'40px 16px',textAlign:'center',color:colors.textDim,fontSize:12}}>Loading...</div> : tickets.length===0 ? <div style={{padding:'40px 16px',textAlign:'center',color:colors.textDim,fontSize:12}}>No support tickets found. Click "New Support Ticket" to create one.</div> : tickets.map(t=>(
              <div key={t.id} onClick={()=>setSelected(t)}
                style={{padding:'12px 14px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.04)',background:selected?.id===t.id?'rgba(59,130,246,0.08)':'transparent'}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{t.subject}</div>
                <div style={{fontSize:11,color:colors.textDim,display:'flex',justifyContent:'space-between'}}>
                  <span style={{background:'rgba(34,197,94,0.12)',color:colors.green,padding:'1px 6px',borderRadius:4}}>{t.status}</span>
                  <span>{timeAgo(t.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat area */}
          <div className="glass-card" style={{borderRadius:12,display:'flex',flexDirection:'column'}}>
            {!selected?(
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:colors.textDim}}>
                <div style={{fontSize:32,marginBottom:12}}>💬</div>
                <div style={{fontSize:13}}>Select a ticket from the left column to start live chat</div>
              </div>
            ):(
              <>
                <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',fontWeight:600,fontSize:14}}>{selected.subject}</div>
                <div style={{flex:1,overflow:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
                  {(selected.messages||[]).map((m,i)=>(
                    <div key={i} style={{display:'flex',flexDirection:'column',alignItems:m.sender==='user'?'flex-end':'flex-start'}}>
                      <div style={{maxWidth:'70%',padding:'10px 14px',borderRadius:10,background:m.sender==='user'?'rgba(34,197,94,0.12)':'rgba(255,255,255,0.06)',fontSize:13}}>{m.text}</div>
                      <div style={{fontSize:10,color:colors.textDim,marginTop:2}}>{m.sender==='support'?'Support':userEmail?.split('@')[0]}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:10}}>
                  <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} placeholder="Type a message..."
                    style={{flex:1,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'10px 14px',color:colors.text,fontSize:13,outline:'none'}}/>
                  <button onClick={handleSend} style={{padding:'10px 18px',background:colors.blue,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* New Ticket Modal */}
        {showNew&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)'}}>
            <div style={{background:'#111218',border:'1px solid #2a2d38',borderRadius:16,padding:36,width:440,position:'relative'}}>
              <button onClick={()=>setShowNew(false)} style={{position:'absolute',top:14,right:16,background:'none',border:'none',color:colors.textDim,fontSize:20,cursor:'pointer'}}>✕</button>
              <h2 style={{fontSize:18,fontWeight:700,margin:'0 0 20px'}}>New Support Ticket</h2>
              <input value={newTicket.subject} onChange={e=>setNewTicket(p=>({...p,subject:e.target.value}))} placeholder="Subject"
                style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'10px 14px',color:colors.text,fontSize:13,outline:'none',marginBottom:12,boxSizing:'border-box'}}/>
              <textarea value={newTicket.message} onChange={e=>setNewTicket(p=>({...p,message:e.target.value}))} placeholder="Describe your issue..." rows={4}
                style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'10px 14px',color:colors.text,fontSize:13,outline:'none',resize:'none',boxSizing:'border-box',marginBottom:16}}/>
              <button onClick={handleCreate} disabled={!newTicket.subject.trim()||!newTicket.message.trim()||submitting}
                style={{width:'100%',padding:'12px',background:newTicket.subject.trim()&&newTicket.message.trim()?colors.green:'#333',color:'#000',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>
                Create Ticket
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
