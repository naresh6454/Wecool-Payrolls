import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wecool Payroll",
  description: "Smart Payroll Management System",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#FAFAF8] font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1C1917",
              color: "#F5F5F4",
              borderRadius: "10px",
              border: "1px solid #44403C",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#16A34A", secondary: "#fff" } },
            error: { iconTheme: { primary: "#DC2626", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
