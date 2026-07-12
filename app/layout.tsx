import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pujan Joshi | Frontend Engineer & Web OS Simulator",
  description: "Hi! I'm Pujan Joshi, a React & TypeScript Frontend Engineer. Explore my interactive, Windows-inspired web desktop simulation portfolio showcasing my projects, skills, and experience.",
  keywords: ["Pujan Joshi", "Portfolio", "Web OS", "React Developer", "TypeScript", "Frontend Engineer", "Interactive Portfolio", "Windows Simulation", "Software Engineer"],
  authors: [{ name: "Pujan Joshi", url: "https://pujan-joshi.com.np" }],
  creator: "Pujan Joshi",
  metadataBase: new URL("https://pujan-joshi.com.np"),
  openGraph: {
    title: "Pujan Joshi | Frontend Engineer & Web OS Simulator",
    description: "Welcome to my interactive desktop profile! I'm Pujan Joshi, a Frontend Engineer. Open my custom apps, check out my projects, view my photos, and connect with me.",
    url: "https://pujan-joshi.com.np",
    siteName: "Pujan Joshi Portfolio OS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pujan Joshi | Frontend Engineer & Web OS Simulator",
    description: "Explore my interactive desktop profile where I showcase my projects, skills, and developer experience in a fully functional simulated web OS.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
