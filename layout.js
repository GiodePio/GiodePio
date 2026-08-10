export const metadata = {
  title: "Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#000", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
