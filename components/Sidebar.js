'use client';
import { useRouter, usePathname } from 'next/navigation';

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
};

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className="btn-smooth" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
      background: active ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
      color: active ? colors.green : colors.textDim, fontSize: 14, cursor: 'pointer', marginBottom: 2,
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = colors.text; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textDim; } }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

const NavSection = ({title}) => <div style={{fontSize:10,color:colors.textDim,letterSpacing:2,textTransform:'uppercase',padding:'16px 14px 6px',fontWeight:600}}>{title}</div>;

export default function Sidebar({ userEmail }) {
  const router = useRouter();
  const pathname = usePathname();
  const isOwner = userEmail === 'lifegrading@gmail.com';

  const isActive = (path) => {
    // If the path includes query params like ?tab=plans, we check window.location
    if (typeof window !== 'undefined' && path.includes('?')) {
      return window.location.pathname + window.location.search === path;
    }
    return pathname === path || (pathname !== '/dashboard' && pathname.startsWith(path + '/'));
  };

  const nav = (path) => router.push(path);

  return (
    <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
      </div>
      <div style={{ flex: 1 }}>
        <NavSection title="OVERVIEW"/>
        <NavItem icon="📊" label="Dashboard" active={isActive('/dashboard')} onClick={() => nav('/dashboard')} />
        <NavItem icon="📋" label="Plans" active={isActive('/dashboard?tab=plans')} onClick={() => nav('/dashboard?tab=plans')} />
        
        <NavSection title="MANAGEMENT"/>
        <NavItem icon="⚡" label="Grabs" active={isActive('/dashboard/grabs')} onClick={() => nav('/dashboard/grabs')} />
        <NavItem icon="📡" label="Live Captures" active={isActive('/dashboard?tab=live')} onClick={() => nav('/dashboard?tab=live')} />
        <NavItem icon="🖥" label="Remote Control" active={isActive('/dashboard/remote-control')} onClick={() => nav('/dashboard/remote-control')} />
        
        <NavSection title="UTILITIES"/>
        <NavItem icon="🔨" label="Build" active={isActive('/dashboard/build')} onClick={() => nav('/dashboard/build')} />
        
        <NavSection title="COMMUNITY & ACCESS"/>
        <NavItem icon="⭐" label="+Rep" active={isActive('/dashboard/rep')} onClick={() => nav('/dashboard/rep')} />
        <NavItem icon="📢" label="Updates" active={isActive('/dashboard/updates')} onClick={() => nav('/dashboard/updates')} />
        <NavItem icon="🏆" label="Leaderboard" active={isActive('/dashboard/leaderboard')} onClick={() => nav('/dashboard/leaderboard')} />
        
        <NavSection title="SYSTEM & SUPPORT"/>
        <NavItem icon="💬" label="Join Discord" onClick={() => window.open('https://discord.gg/FV2668v4Zp','_blank')} />
        <NavItem icon="🎫" label="Tickets" active={isActive('/dashboard/tickets')} onClick={() => nav('/dashboard/tickets')} />
        {isOwner && <NavItem icon="👥" label="Admin" onClick={() => nav('/admin')} />}
      </div>
      <div>
        <NavItem icon="⚙️" label="Settings" active={isActive('/dashboard/settings')} onClick={() => nav('/dashboard/settings')} />
        <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
      </div>
    </aside>
  );
}
