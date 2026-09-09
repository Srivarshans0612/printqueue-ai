import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PrintQueue AI — Smart Campus Printing",
  description:
    "Don't join the queue. PrintQueue AI connects students with approved campus print shops and turns uncertain waiting into a predictable pickup experience.",
  keywords: "campus printing, smart printing, print queue, AI recommendation",
  openGraph: {
    title: "PrintQueue AI",
    description: "Smart campus printing platform powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
            success: {
              iconTheme: { primary: "#16a34a", secondary: "#ffffff" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
            },
          }}
        />
      </body>
    </html>
  );
}

