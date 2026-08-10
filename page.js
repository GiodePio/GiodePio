const colors = {
  bg: "#000000",
  panel: "#111214",
  border: "#232427",
  text: "#ffffff",
  textDim: "#9a9a9f",
};

function StatCard({ icon, label, value, sub }) {
  return (
    <div
      style={{
        background: colors.panel,
        borderRadius: 10,
        padding: 16,
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.textDim, fontSize: 12, marginBottom: 10 }}>
        <span>{icon}</span> HELLO
      </div>
      <div style={{ fontSize: 26, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>HELLO</div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 8,
        background: active ? "#1b1c1f" : "transparent",
        color: active ? colors.text : colors.textDim,
        fontSize: 14,
        marginBottom: 2,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", color: colors.text }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 200,
          borderRight: `1px solid ${colors.border}`,
          padding: 16,
        }}
      >
        <div style={{ height: 28, marginBottom: 24 }} />
        <NavItem icon="📊" label="HELLO" active />
        <NavItem icon="📈" label="HELLO" />
        <NavItem icon="🔧" label="HELLO" />
        <NavItem icon="📋" label="Plans" />
        <NavItem icon="⭐" label="+Rep" />
        <NavItem icon="📡" label="HELLO" />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>Good evening, bnn.</h1>
        <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 24 }}>
          Your workspace is ready.
        </p>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <StatCard icon="👥" value="0" />
          <StatCard icon="💬" value="0" />
          <StatCard icon="🌐" value="0" />
          <div
            style={{
              background: colors.panel,
              borderRadius: 10,
              padding: 16,
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.textDim, fontSize: 12, marginBottom: 10 }}>
              <span>🔵</span> HELLO
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
              <span>💻 0</span>
              <span>⏳ 0</span>
            </div>
          </div>
        </div>

        {/* Lower section */}
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>HELLO</span>
              <span style={{ fontSize: 13, color: colors.textDim }}>View all →</span>
            </div>
            <div
              style={{
                height: 260,
                background: colors.panel,
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: colors.textDim,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
              <div style={{ fontSize: 13 }}>HELLO</div>
            </div>
          </div>

          <div style={{ width: 260, background: colors.panel, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, marginBottom: 8 }}>
              TOP SERVERS
            </div>
            <div style={{ fontSize: 13, color: colors.textDim }}>No servers yet</div>
          </div>
        </div>
      </main>
    </div>
  );
}
