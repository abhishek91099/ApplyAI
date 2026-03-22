import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AuthCookieSync } from "@/components/AuthCookieSync";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ApplyAI",
  description:
    "Prepare stronger job applications with tailored materials, ATS insight, and interview prep.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-w-0 overflow-x-hidden font-sans antialiased`}
      >
        <Script id="applyai-auth-cookie-repair" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("applyai_token");if(!t)return;var c=document.cookie||"";if(/(?:^|;\\s*)applyai_auth=1(?:;|$)/.test(c))return;document.cookie="applyai_auth=1; path=/; max-age=604800; SameSite=Lax";}catch(e){}})();`}
        </Script>
        <AuthCookieSync />
        {children}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
