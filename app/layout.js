import "./globals.css";

export const metadata = {
  title: "Your Path — Vipassana Course Tracker",
  description: "Track attended and served Vipassana courses and long-course eligibility.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B1917",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
