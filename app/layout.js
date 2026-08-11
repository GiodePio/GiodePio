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
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #333; }
          ::selection { background: rgba(34, 197, 94, 0.3); }
        ` }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
