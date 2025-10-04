import "./globals.css";

export const metadata = {
  title: "Clara Compass",
  description: "Invest where your life overlaps reality.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
