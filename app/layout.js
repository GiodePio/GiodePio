export const metadata = {
  title: "LifeGrabber Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #050508;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            overflow-x: hidden;
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #333; }
          ::selection { background: rgba(34, 197, 94, 0.3); }

          /* Particle background */
          .particle-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
          }
          .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255,255,255,0.15);
            border-radius: 50%;
            animation: float linear infinite;
          }
          @keyframes float {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
          }

          /* Smooth page transitions */
          .page-enter {
            animation: fadeSlideIn 0.3s ease-out forwards;
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Card hover effect */
          .glass-card {
            background: rgba(13, 13, 18, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.06);
            transition: all 0.25s ease;
          }
          .glass-card:hover {
            border-color: rgba(255,255,255,0.12);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          }

          /* Smooth button transitions */
          .btn-smooth {
            transition: all 0.2s ease;
          }
          .btn-smooth:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .btn-smooth:active {
            transform: translateY(0);
          }

          /* Input focus glow */
          input:focus, textarea:focus {
            outline: none;
            border-color: rgba(34, 197, 94, 0.5) !important;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
          }
        ` }} />
      </head>
      <body>
        <div className="particle-bg">
          {Array.from({length: 50}).map((_, i) => (
            <div key={i} className="particle" style={{
              left: Math.random() * 100 + '%',
              animationDuration: (Math.random() * 20 + 15) + 's',
              animationDelay: (Math.random() * 20) + 's',
              width: (Math.random() * 2 + 1) + 'px',
              height: (Math.random() * 2 + 1) + 'px',
            }} />
          ))}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
