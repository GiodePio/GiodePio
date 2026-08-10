'use client';

import { useState, useEffect } from 'react';

const colors = {
  bg: '#0a0a0f',
  panel: '#111218',
  border: '#1e1f28',
  text: '#ffffff',
  textDim: '#6b6e7b',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
};

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8,
      background: active ? '#1a1b24' : 'transparent',
      color: active ? colors.text : colors.textDim, fontSize: 14, cursor: 'pointer', marginBottom: 2,
    }}>
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ background: colors.green, color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{badge}</span>}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: colors.panel, borderRadius: 10, padding: 18, border: `1px solid ${colors.border}`, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textDim, fontSize: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || colors.text }}>{value}</div>
    </div>
  );
}

function Overview({ stats }) {
  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px 0' }}>Overview</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers || 0} />
        <StatCard icon="✅" label="Active Users" value={(stats?.totalUsers || 0) - (stats?.bannedUsers || 0) - (stats?.suspendedUsers || 0)} color={colors.green} />
        <StatCard icon="🚫" label="Banned" value={stats?.bannedUsers || 0} color={colors.red} />
        <StatCard icon="⏸️" label="Suspended" value={stats?.suspendedUsers || 0} color={colors.yellow} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <StatCard icon="🔑" label="Admins" value={stats?.admins || 0} />
        <StatCard icon="🔗" label="Endpoints" value={stats?.activeEndpoints || 0} />
        <StatCard icon="📊" label="Requests Today" value={stats?.requestsToday || 0} />
        <StatCard icon="❌" label="Failed" value={stats?.failedRequests || 0} color={colors.red} />
      </div>
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20, search });
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const handleAction = async (userId, action, data = {}) => {
    if (action === 'delete' && !confirm('Delete this user?')) return;
    if (action === 'ban' && !confirm('Ban this user?')) return;

    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, data }),
    });
    fetchUsers();
  };

  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px 0' }}>Users</h2>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search users..."
        style={{ width: 300, background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none', marginBottom: 20 }}
      />
      <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: colors.textDim, fontWeight: 500 }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: colors.textDim, fontWeight: 500 }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: colors.textDim, fontWeight: 500 }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: colors.textDim, fontWeight: 500 }}>Created</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: colors.textDim, fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 500 }}>{user.display_name || user.email}</div>
                  <div style={{ fontSize: 12, color: colors.textDim }}>{user.email}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#1a2a1a', color: colors.green, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{user.role}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: user.status === 'active' ? '#1a2a1a' : user.status === 'banned' ? '#2a1a1a' : '#2a2a1a',
                    color: user.status === 'active' ? colors.green : user.status === 'banned' ? colors.red : colors.yellow,
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  }}>{user.status}</span>
                </td>
                <td style={{ padding: '12px 16px', color: colors.textDim }}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <select
                    onChange={e => {
                      const [action, value] = e.target.value.split(':');
                      if (action === 'role') handleAction(user.id, 'update_role', { role: value });
                      else handleAction(user.id, action);
                    }}
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 10px', color: colors.text, fontSize: 12 }}
                  >
                    <option value="">Actions</option>
                    <option value="role:administrator">Make Admin</option>
                    <option value="role:moderator">Make Mod</option>
                    <option value="role:user">Make User</option>
                    {user.status === 'active' && <option value="ban">Ban</option>}
                    {user.status === 'active' && <option value="suspend">Suspend</option>}
                    {user.status === 'banned' && <option value="unban">Unban</option>}
                    {user.status === 'suspended' && <option value="unsuspend">Unsuspend</option>}
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ padding: 20, textAlign: 'center', color: colors.textDim }}>Loading...</div>}
        {!loading && users.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: colors.textDim }}>No users found</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13, color: colors.textDim }}>
        <span>Total: {total} users</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 12px', color: colors.text, cursor: 'pointer' }}>Previous</button>
          <span style={{ padding: '6px 12px' }}>Page {page}</span>
          <button disabled={users.length < 20} onClick={() => setPage(p => p + 1)} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 12px', color: colors.text, cursor: 'pointer' }}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [page, setPage] = useState('overview');
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/user').then(r => r.json()).then(d => setUser(d.user));
    fetch('/api/admin/stats').then(r => r.json()).then(d => setStats(d.stats));
  }, []);

  if (!user) {
    return <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 240, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 10px', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Admin Panel</div>
          <div style={{ fontSize: 12, color: colors.textDim }}>{user.email}</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 14px', marginBottom: 4 }}>Dashboard</div>
          <NavItem icon="📊" label="Overview" active={page === 'overview'} onClick={() => setPage('overview')} />

          <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 14px', marginTop: 12, marginBottom: 4 }}>Users</div>
          <NavItem icon="👥" label="All Users" active={page === 'users'} onClick={() => setPage('users')} />
          <NavItem icon="🚫" label="Banned" active={page === 'banned'} onClick={() => setPage('banned')} />
          <NavItem icon="⏸️" label="Suspended" active={page === 'suspended'} onClick={() => setPage('suspended')} />

          <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 14px', marginTop: 12, marginBottom: 4 }}>Endpoints</div>
          <NavItem icon="🔗" label="All Endpoints" active={page === 'endpoints'} onClick={() => setPage('endpoints')} />
          <NavItem icon="➕" label="Create Endpoint" active={page === 'create-endpoint'} onClick={() => setPage('create-endpoint')} />

          <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 14px', marginTop: 12, marginBottom: 4 }}>Security</div>
          <NavItem icon="📋" label="Audit Logs" active={page === 'audit'} onClick={() => setPage('audit')} />
          <NavItem icon="🛡️" label="Security Events" active={page === 'security'} onClick={() => setPage('security')} />
        </div>

        <div>
          <NavItem icon="🚪" label="Logout" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        {page === 'overview' && <Overview stats={stats} />}
        {page === 'users' && <UsersPage />}
        {page === 'banned' && <UsersPage />}
        {page === 'suspended' && <UsersPage />}
      </main>
    </div>
  );
}
