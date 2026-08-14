'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const colors = { bg:'#050508', border:'rgba(255,255,255,0.06)', text:'#f0f0f0', textDim:'#6b6e7b', green:'#22c55e', blue:'#3b82f6', panel:'rgba(13,13,18,0.7)' };


export default function UpdatesPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ 
    fetch('/api/auth/user').then(r=>r.json()).then(d=>{ if(d.user) setUserEmail(d.user.email); }); 
    fetch('/api/updates').then(r=>r.json()).then(d=>{ setUpdates(d.updates || []); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  return (
    <div style={{display:'flex',minHeight:'100vh',background:colors.bg,color:colors.text,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'}}>
      <Sidebar userEmail={userEmail} router={router}/>
      <main style={{flex:1,padding:'28px 36px',overflow:'auto'}}>
        <h1 style={{fontSize:22,fontWeight:700,margin:'0 0 4px'}}>📢 Updates</h1>
        <p style={{color:colors.textDim,fontSize:13,margin:'0 0 28px'}}>What's new in LifeGrabber.</p>
        <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:700}}>
          {loading ? <div style={{color:colors.textDim}}>Loading updates...</div> : updates.length === 0 ? <div style={{color:colors.textDim}}>No updates found.</div> : null}
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
