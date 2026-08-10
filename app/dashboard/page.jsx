export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-48 border-r border-gray-800 flex flex-col p-3 gap-1">
        <div className="h-8 mb-4" /> {/* logo/banner spot */}

        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-sm">
          <span>📊</span> HELLO
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800">
          <span>📈</span> HELLO
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800">
          <span>🔧</span> HELLO
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800">
          <span>📋</span> Plans
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800">
          <span>⭐</span> +Rep
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800">
          <span>📡</span> HELLO
        </a>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Good evening, bnn.</h1>
        <p className="text-gray-400 text-sm mb-6">Your workspace is ready.</p>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard icon="👥" label="HELLO" value={0} sub="HELLO" />
          <StatCard icon="💬" label="HELLO" value={0} sub="HELLO" />
          <StatCard icon="🌐" label="HELLO" value={0} sub="HELLO" />
          <StatCard icon="🔵" label="HELLO" value={null} extra="0" extra2="0" />
        </div>

        {/* Lower section */}
        <div className="grid grid-cols-[1fr_320px] gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">HELLO</span>
              <a href="#" className="text-sm text-gray-400">View all →</a>
            </div>
            <div className="h-72 bg-gray-900 rounded-lg flex flex-col items-center justify-center text-gray-500">
              <span className="text-2xl mb-2">✉️</span>
              <span className="text-sm">HELLO</span>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2 tracking-wide">TOP SERVERS</p>
            <p className="text-sm text-gray-500">No servers yet</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub, extra, extra2 }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
        <span>{icon}</span> {label}
      </div>
      {value !== null ? (
        <>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{sub}</p>
        </>
      ) : (
        <div className="flex gap-4 text-sm text-gray-300 mt-1">
          <span>💻 {extra}</span>
          <span>⏳ {extra2}</span>
        </div>
      )}
    </div>
  );
}
