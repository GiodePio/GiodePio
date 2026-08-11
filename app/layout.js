import Particles from './components/Particles';

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

          @keyframes float {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
          }

          .page-enter {
            animation: fadeSlideIn 0.3s ease-out forwards;
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

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

          input:focus, textarea:focus {
            outline: none;
            border-color: rgba(34, 197, 94, 0.5) !important;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
          }
        ` }} />
      </head>
      <body>
        <Particles />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
