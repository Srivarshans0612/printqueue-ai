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
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fafafa",
              border: "1px solid #3f3f46",
              borderRadius: "10px",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#18181b" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#18181b" },
            },
          }}
        />
      </body>
    </html>
  );
}
