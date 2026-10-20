import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "استوديو فن الخيوط والمسامير | String Art Studio",
  description: "حوّل صورك إلى تصاميم فن الخيوط والمسامير الواقعية بخيط واحد مستمر، مع قوالب طباعة بمقاسات حقيقية ومشغل تفاعلي لخطوات التنفيذ.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('string_art_theme');
                if (saved === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
