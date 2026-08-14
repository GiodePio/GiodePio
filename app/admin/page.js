'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  bg: '#0a0a0d',
  sidebar: '#0d0d12',
  panel: 'rgba(18, 18, 26, 0.8)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  textMid: '#9ca0ae',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#f59e0b',
  purple: '#a855f7',
};

// ─── Sidebar NavItem ───────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 7,
        background: active ? 'rgba(239,68,68,0.12)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: active ? '2px solid #ef4444' : '2px solid transparent',
        color: active ? '#ef4444' : hovered ? colors.text : colors.textDim,
        fontSize: 13.5, cursor: 'pointer', marginBottom: 1, transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );
}

function NavSection({ title }) {
  return (
    <div style={{
      fontSize: 10, color: colors.textDim, letterSpacing: 1.5, textTransform: 'uppercase',
      padding: '14px 12px 5px', fontWeight: 700, opacity: 0.7,
    }}>
      {title}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10,
      padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, color }}>{icon}</span>
        <span style={{ fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: colors.text, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ─── Section: Home ─────────────────────────────────────────────────────────────
function HomeView({ users }) {
  const proUsers = users.filter(u => u.is_pro);
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Home</h1>
        </div>
        <p style={{ color: colors.textDim, fontSize: 13, marginTop: 4 }}>Overview and quick actions.</p>
        <div style={{ height: 1, background: colors.border, marginTop: 16 }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 15 }}>🏠</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Admin Home</div>
            <div style={{ fontSize: 12, color: colors.textDim }}>Overview, platform health, and quick links.</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard label="Total Users" value={users.length} icon="👥" color={colors.blue} />
        <StatCard label="+Rep Reviews" value="—" icon="💬" color={colors.green} />
        <StatCard label="Risk Cases" value="—" icon="⚠️" color={colors.yellow} />
        <StatCard label="Pro Users" value={proUsers.length} icon="👑" color={colors.purple} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { icon: '👥', label: 'Manage Users', desc: 'View and edit user accounts' },
            { icon: '💬', label: 'Moderate +Rep', desc: 'Review reputation entries' },
            { icon: '⚠️', label: 'Review Abuse / Risk', desc: 'Handle flagged content' },
            { icon: '🌐', label: 'Capture API', desc: 'Manage API endpoints' },
            { icon: '⚙️', label: 'Platform Settings', desc: 'Global configuration' },
            { icon: '📦', label: 'Push Mod Update', desc: 'Deploy a new version' },
          ].map(a => (
            <div key={a.label} style={{
              background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 8,
              padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 15 }}>{a.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</span>
              </div>
              <div style={{ fontSize: 11, color: colors.textDim }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Users ─────────────────────────────────────────────────────────────
function UsersView({ users, updating, secondsInput, setSecondsInput, onGrantPro, onRevokePro, onAdjustUses, onRefresh, error }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>👥</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Users</h1>
          </div>
          <p style={{ color: colors.textDim, fontSize: 13 }}>{users.length} registered users</p>
        </div>
        <button onClick={onRefresh} style={{ cursor: 'pointer', padding: '8px 16px', background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 8, fontSize: 12, color: colors.text, transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '12px 16px', color: colors.red, marginBottom: 20, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid ' + colors.border, background: colors.panel }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Email', 'Pro Status', 'Grant / Revoke', 'Free Uses', 'Adjust Uses'].map(h => (
                <th key={h} style={{ textAlign: h === 'Email' ? 'left' : 'center', padding: '12px 16px', fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isPro = u.is_pro;
              const remainingSec = u.remaining_pro_seconds;
              const freeUses = u.free_uses_remaining;
              const displayFreeUses = isPro ? '∞ (Pro)' : (freeUses !== null && freeUses !== undefined ? `${freeUses} remaining` : '3 remaining');
              const isOwner = u.email?.toLowerCase().trim() === 'lifegrading@gmail.com';

              return (
                <tr key={u.id} style={{ borderBottom: '1px solid ' + colors.border }}>
                  <td style={{ padding: '14px 16px', fontSize: 13 }}>
                    <div style={{ color: colors.text }}>{u.email}</div>
                    {isOwner && <span style={{ fontSize: 10, color: colors.red, fontWeight: 700 }}>OWNER</span>}
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {isPro ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ background: 'rgba(34,197,94,0.15)', color: colors.green, fontSize: 11, padding: '4px 12px', borderRadius: 6, fontWeight: 700 }}>👑 PRO</span>
                        {typeof remainingSec === 'number' && (
                          <span style={{ fontSize: 11, color: colors.blue, fontFamily: 'monospace' }}>⏳ {remainingSec}s left</span>
                        )}
                        {remainingSec === null && !isOwner && (
                          <span style={{ fontSize: 10, color: colors.textDim }}>Permanent</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ background: 'rgba(239,68,68,0.15)', color: colors.red, fontSize: 11, padding: '4px 12px', borderRadius: 6, fontWeight: 600 }}>FREE TRIAL</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {isOwner ? (
                      <span style={{ fontSize: 11, color: colors.textDim }}>Permanent Owner</span>
                    ) : isPro ? (
                      <button onClick={() => onRevokePro(u.email)} disabled={updating === `${u.email}_pro`} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: colors.red, color: '#fff', opacity: updating === `${u.email}_pro` ? 0.5 : 1 }}>
                        Revoke Pro
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => onGrantPro(u.email, 0)} disabled={updating === `${u.email}_pro`} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(90deg,#22c55e,#16a34a)', color: '#000', opacity: updating === `${u.email}_pro` ? 0.5 : 1, width: '100%' }}>
                          ✓ Grant Permanent
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="number" placeholder="Sec" value={secondsInput[u.email] !== undefined ? secondsInput[u.email] : 60} onChange={e => setSecondsInput(p => ({ ...p, [u.email]: e.target.value }))} style={{ width: 60, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + colors.border, borderRadius: 6, padding: '6px 8px', color: colors.text, fontSize: 12, outline: 'none' }} />
                          <button onClick={() => onGrantPro(u.email)} disabled={updating === `${u.email}_pro`} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + colors.border, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(34,197,94,0.12)', color: colors.green, opacity: updating === `${u.email}_pro` ? 0.5 : 1 }}>
                            Timed ({secondsInput[u.email] || 60}s)
                          </button>
                        </div>
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: isPro ? colors.green : colors.text }}>{displayFreeUses}</td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {!isPro && !isOwner ? (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => onAdjustUses(u.email, 'remove_use')} disabled={updating === `${u.email}_remove_use`} style={{ width: 32, height: 28, borderRadius: 5, border: '1px solid ' + colors.border, background: 'rgba(239,68,68,0.1)', color: colors.red, fontSize: 14, cursor: 'pointer', opacity: updating === `${u.email}_remove_use` ? 0.5 : 1 }}>−</button>
                        <button onClick={() => onAdjustUses(u.email, 'add_use')} disabled={updating === `${u.email}_add_use`} style={{ width: 32, height: 28, borderRadius: 5, border: '1px solid ' + colors.border, background: 'rgba(34,197,94,0.1)', color: colors.green, fontSize: 14, cursor: 'pointer', opacity: updating === `${u.email}_add_use` ? 0.5 : 1 }}>+</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: colors.textDim }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: colors.textDim, fontSize: 13 }}>No users found in database.</div>
        )}
      </div>
    </div>
  );
}

// ─── Placeholder View ─────────────────────────────────────────────────────────
function PlaceholderView({ icon, title, subtitle }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h1>
        </div>
        <p style={{ color: colors.textDim, fontSize: 13 }}>{subtitle}</p>
        <div style={{ height: 1, background: colors.border, marginTop: 16 }} />
      </div>
      <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, padding: '60px', textAlign: 'center', color: colors.textDim, fontSize: 13 }}>
        🚧 This section is under construction.
      </div>
    </div>
  );
}

// ─── Section: Platform ─────────────────────────────────────────────────────────
function PlatformView() {
  const [settings, setSettings] = useState({
    globalLockdown: false,
    maintenanceMode: false,
    lockBuilds: false,
    disableRemoteAccess: false,
  });
  const [disabledMsg, setDisabledMsg] = useState('Downloads and builds are temporarily disabled.');
  const [saving, setSaving] = useState(null);

  const Toggle = ({ id, value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? colors.red : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );

  const SettingRow = ({ icon, label, desc, settingKey, danger }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: danger && settings[settingKey] ? 'rgba(239,68,68,0.08)' : 'transparent', borderBottom: '1px solid ' + colors.border, borderLeft: danger && settings[settingKey] ? '3px solid ' + colors.red : '3px solid transparent', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: danger && settings[settingKey] ? colors.red : colors.text }}>{label}</div>
          <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>{desc}</div>
        </div>
      </div>
      <Toggle id={settingKey} value={settings[settingKey]} onChange={v => setSettings(p => ({ ...p, [settingKey]: v }))} />
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Platform</h1>
        </div>
        <p style={{ color: colors.textDim, fontSize: 13 }}>Maintenance settings.</p>
        <div style={{ height: 1, background: colors.border, marginTop: 16 }} />
      </div>

      <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + colors.border, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚙️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Platform Settings</div>
            <div style={{ fontSize: 12, color: colors.textDim }}>Manage global dashboard behavior.</div>
          </div>
        </div>
        <SettingRow icon="🔴" label="Global Site Lockdown" desc="Completely disables EVERY access to the website (including the landing page and login) for all users except you." settingKey="globalLockdown" danger />
        <SettingRow icon="🟡" label="Maintenance Mode" desc="Lock the dashboard for everyone except you." settingKey="maintenanceMode" />
        <SettingRow icon="🟠" label="Lock Builds & Downloads" desc="Blocks building mods and downloading user/Auth Mods. Admin can still use both." settingKey="lockBuilds" />
        <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + colors.border }}>
          <div style={{ fontSize: 12, color: colors.textDim, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Disabled Message</div>
          <textarea value={disabledMsg} onChange={e => setDisabledMsg(e.target.value)} style={{ width: '100%', minHeight: 80, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + colors.border, borderRadius: 7, padding: '10px 12px', color: colors.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ fontSize: 11, color: colors.textDim, marginTop: 6 }}>This text is shown when a non-admin user tries to build or download a locked version.</div>
        </div>
        <SettingRow icon="🔴" label="Disable Remote Access (Global)" desc="Completely block all C2 requests and hide the feature from users." settingKey="disableRemoteAccess" danger />
      </div>
    </div>
  );
}

// ─── Section: Deployments ─────────────────────────────────────────────────────
function DeploymentsView() {
  const [targetVersion, setTargetVersion] = useState('Global');
  const [changelog, setChangelog] = useState('- Added new feature\n- Fixed rendering bug...');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise(r => setTimeout(r, 1500));
    setDeploying(false);
    setDeployed(true);
    setTimeout(() => setDeployed(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>📡</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Deployments</h1>
        </div>
        <p style={{ color: colors.textDim, fontSize: 13 }}>Push mod updates.</p>
        <div style={{ height: 1, background: colors.border, marginTop: 16 }} />
      </div>

      <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, padding: '24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 16 }}>📡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Push Mod Update</div>
            <div style={{ fontSize: 12, color: colors.textDim }}>Increment version mappings and publish a changelog entry.</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: colors.textDim, marginBottom: 6, fontWeight: 600 }}>Target Version</label>
          <select value={targetVersion} onChange={e => setTargetVersion(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + colors.border, borderRadius: 7, padding: '10px 12px', color: colors.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="Global">Global</option>
            <option value="Beta">Beta</option>
            <option value="Alpha">Alpha</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: colors.textDim, marginBottom: 6, fontWeight: 600 }}>Changelog</label>
          <textarea value={changelog} onChange={e => setChangelog(e.target.value)} style={{ width: '100%', minHeight: 140, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + colors.border, borderRadius: 7, padding: '10px 12px', color: colors.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }} />
        </div>

        <button onClick={handleDeploy} disabled={deploying} style={{
          width: '100%', padding: '13px 0', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 700, cursor: deploying ? 'not-allowed' : 'pointer',
          background: deployed ? colors.green : 'linear-gradient(90deg,#3b82f6,#2563eb)', color: '#fff',
          opacity: deploying ? 0.7 : 1, transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {deploying ? '⏳ Deploying...' : deployed ? '✓ Deployed!' : '📡 Deploy Update'}
        </button>
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [view, setView] = useState('home');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [secondsInput, setSecondsInput] = useState({});
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (!d.user || d.user.email?.toLowerCase().trim() !== 'lifegrading@gmail.com') {
          setError('Unauthorized');
          setLoading(false);
          setAuthChecked(true);
          return;
        }
        setAuthChecked(true);
        fetchUsers();
      })
      .catch(() => { setError('Auth check failed'); setLoading(false); setAuthChecked(true); });
  }, []);

  // countdown timer for timed pro
  useEffect(() => {
    const iv = setInterval(() => {
      setUsers(prev => prev.map(u => {
        if (u.is_pro && typeof u.remaining_pro_seconds === 'number' && u.remaining_pro_seconds > 0) {
          const next = u.remaining_pro_seconds - 1;
          return { ...u, remaining_pro_seconds: next, is_pro: next > 0, free_uses_remaining: next > 0 ? null : 3 };
        }
        return u;
      }));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
      else setError(data.error || 'Failed to load users');
    } catch (e) {
      setError('Network error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleGrantPro = async (email, durationSec) => {
    const permanent = durationSec === 0;
    const sec = permanent ? undefined : (durationSec !== undefined ? durationSec : Number(secondsInput[email] || 60));
    setUpdating(`${email}_pro`);
    setError(null);
    try {
      const body = permanent ? { email, is_pro: true } : { email, is_pro: true, duration_seconds: sec };
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, is_pro: true, pro_expires_at: data.pro_expires_at, remaining_pro_seconds: data.remaining_pro_seconds, free_uses_remaining: null } : u));
      } else {
        setError(`Failed to grant Pro for ${email}: ${data.error || res.statusText}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleRevokePro = async (email) => {
    setUpdating(`${email}_pro`);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, is_pro: false }) });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, is_pro: false, pro_expires_at: null, remaining_pro_seconds: null, free_uses_remaining: 3 } : u));
      } else {
        setError(`Failed to revoke Pro: ${data.error}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleAdjustUses = async (email, action) => {
    setUpdating(`${email}_${action}`);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, action }) });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, is_pro: false, free_uses_remaining: data.free_uses_remaining } : u));
      } else {
        setError(`Failed to adjust uses: ${data.error}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!authChecked || loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: colors.textDim, fontSize: 14 }}>Loading admin panel...</div>
      </div>
    );
  }

  // ─── Unauthorized ──────────────────────────────────────────────────────────
  if (error === 'Unauthorized' || error === 'Auth check failed') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Access Denied</div>
        <div style={{ fontSize: 14, color: colors.textDim }}>You must be signed in as owner to access this panel.</div>
      </div>
    );
  }

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'tickets', icon: '🎫', label: 'Tickets' },
    { id: 'rep', icon: '⭐', label: '+Rep' },
    { id: 'abuse', icon: '⚠️', label: 'Abuse / Risk' },
    { id: 'capture-api', icon: '🌐', label: 'Capture API' },
    { id: 'platform', icon: '⚙️', label: 'Platform' },
    { id: 'deployments', icon: '📡', label: 'Deployments' },
    { id: 'grabs', icon: '⚡', label: 'Grabs' },
    { id: 'purchases', icon: '💰', label: 'Purchases' },
    { id: 'updates', icon: '📦', label: 'Updates' },
    { id: 'crypto', icon: '₿', label: 'Crypto' },
  ];

  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView users={users} />;
      case 'users': return <UsersView users={users} updating={updating} secondsInput={secondsInput} setSecondsInput={setSecondsInput} onGrantPro={handleGrantPro} onRevokePro={handleRevokePro} onAdjustUses={handleAdjustUses} onRefresh={fetchUsers} error={error} />;
      case 'platform': return <PlatformView />;
      case 'deployments': return <DeploymentsView />;
      case 'tickets': return <PlaceholderView icon="🎫" title="Tickets" subtitle="Support ticket management." />;
      case 'rep': return <PlaceholderView icon="⭐" title="+Rep" subtitle="Review and moderate reputation entries." />;
      case 'abuse': return <PlaceholderView icon="⚠️" title="Abuse / Risk" subtitle="Handle flagged content and risk cases." />;
      case 'capture-api': return <PlaceholderView icon="🌐" title="Capture API" subtitle="Manage capture API endpoints and submissions." />;
      case 'grabs': return <PlaceholderView icon="⚡" title="Grabs" subtitle="All grabs across the platform." />;
      case 'purchases': return <PlaceholderView icon="💰" title="Purchases" subtitle="Transaction and purchase history." />;
      case 'updates': return <PlaceholderView icon="📦" title="Updates" subtitle="Mod update and changelog history." />;
      case 'crypto': return <PlaceholderView icon="₿" title="Crypto" subtitle="Cryptocurrency payment management." />;
      default: return <HomeView users={users} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 210, minWidth: 210, borderRight: '1px solid ' + colors.border,
        padding: '16px 10px', display: 'flex', flexDirection: 'column',
        background: colors.sidebar, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* App header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>X</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Xgrabber</div>
            <div style={{ fontSize: 10, color: colors.red, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>ADMIN</div>
          </div>
        </div>

        {/* Owner Panel badge */}
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: colors.red }}>⊙</span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.text }}>Owner Panel</div>
            <div style={{ fontSize: 10.5, color: colors.textDim }}>Signed in</div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavItem key={item.id} icon={item.icon} label={item.label} active={view === item.id} onClick={() => setView(item.id)} />
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{ borderTop: '1px solid ' + colors.border, paddingTop: 10, marginTop: 8 }}>
          <NavItem icon="🏠" label="Back to Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 36px', overflow: 'auto', minHeight: '100vh' }}>
        {renderView()}
      </main>
    </div>
  );
}
