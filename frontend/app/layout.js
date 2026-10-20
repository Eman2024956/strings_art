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
  metadataBase: new URL("https://strings-art-studio.vercel.app"),
  title: "استوديو فن الخيوط والمسامير | String Art Studio",
  description: "حوّل صورك إلى تصاميم فن الخيوط والمسامير الواقعية بخيط واحد مستمر، مع قوالب طباعة بمقاسات حقيقية ومشغل تفاعلي لخطوات التنفيذ.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "استوديو فن الخيوط والمسامير | String Art Studio",
    description: "حوّل صورك إلى لوحات فن الخيوط والمسامير الواقعية بخيط واحد مستمر، مع قوالب طباعة بمقاسات حقيقية 1:1 وقوالب مقسمة A4 ومشغل خطوات تفاعلي.",
    url: "https://strings-art-studio.vercel.app",
    siteName: "String Art Studio",
    locale: "ar_AR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "استوديو فن الخيوط والمسامير | String Art Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "استوديو فن الخيوط والمسامير | String Art Studio",
    description: "حوّل صورك إلى تصاميم فن الخيوط والمسامير الواقعية بخيط واحد مستمر، مع قوالب طباعة بمقاسات حقيقية 1:1 ومشغل تفاعلي.",
    images: ["/og-image.png"],
  },
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
