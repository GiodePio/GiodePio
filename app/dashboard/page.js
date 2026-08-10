const colors = {
  bg: "#12161c",
  card: "#1a2129",
  border: "#28313b",
  text: "#eef1f4",
  textDim: "#9aa5b1",
  primary: "#5fb87a",
};

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 32px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: colors.primary }} />
          BlockLens
        </div>
        <span style={{ fontSize: 14, color: colors.textDim }}>HELLO</span>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Look up a profile</h1>
        <p style={{ color: colors.textDim, fontSize: 14, marginTop: 6, marginBottom: 28 }}>
          Search any Minecraft username to see their UUID, skin, and cape.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="Notch"
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              color: colors.text,
              fontSize: 14,
            }}
          />
          <button
            style={{
              background: colors.primary,
              color: "#0a1a0e",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </div>

        <div
          style={{
            marginTop: 64,
            border: `1px dashed ${colors.border}`,
            borderRadius: 12,
            padding: "48px 0",
            textAlign: "center",
            color: colors.textDim,
            fontSize: 14,
          }}
        >
          HELLO
        </div>
      </main>
    </div>
  );
}
