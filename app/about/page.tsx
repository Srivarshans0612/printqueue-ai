import Link from "next/link";
import { Printer, Brain, Users, Shield, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/navbar/PublicNav";

const team = [
  { role: "Full-Stack Development", tech: "Next.js, TypeScript, React" },
  { role: "Database & Auth", tech: "Supabase PostgreSQL, Supabase Auth" },
  { role: "AI Integration", tech: "Google Gemini API" },
  { role: "Real-time Features", tech: "Supabase Realtime" },
  { role: "File Storage", tech: "Supabase Storage" },
  { role: "Deployment", tech: "Vercel" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNav />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <Badge variant="lime" className="mb-4">
              <Brain className="w-3 h-3 mr-1" />
              About PrintQueue AI
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Smart Printing Without <span className="gradient-text">The Queue</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              PrintQueue AI is a full-stack campus printing platform built to eliminate the frustration of physical print queues — powered by AI, real-time data, and a clean digital workflow.
            </p>
          </div>

          {/* Problem & Solution */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="glass-card p-6 border-red-500/20">
              <h2 className="text-xl font-bold text-slate-900 mb-3">The Problem</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Students on every campus waste significant time physically visiting printing shops without knowing if the shop is open, how long the queue is, what the cost will be, or when their documents will be ready. This leads to repeated trips, missed deadlines, and unnecessary frustration.
              </p>
            </div>
            <div className="glass-card p-6 border-lime-500/20">
              <h2 className="text-xl font-bold text-slate-900 mb-3">The Solution</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                PrintQueue AI provides a complete digital ordering platform. Students select a campus location, get AI-powered shop recommendations, upload documents, configure print settings, place orders, and track them in real-time — all without leaving their seat.
              </p>
            </div>
          </div>

          {/* Architecture */}
          <div className="glass-card p-8 mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Architecture</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              {[
                { icon: Users, label: "Students / Owners / Admins", color: "text-blue-400" },
                { icon: Zap, label: "Next.js App Router + Server Actions", color: "text-slate-600" },
                { icon: Shield, label: "Supabase Auth + PostgreSQL + RLS", color: "text-emerald-400" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${item.color}`} />
                    <p className="text-sm text-slate-500">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Technology Stack</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((t) => (
                <div key={t.role} className="glass-card p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.role}</p>
                  <p className="text-slate-900 text-sm font-medium">{t.tech}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features list */}
          <div className="glass-card p-8 mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Features</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "AI-powered shop recommendation with explainable reasoning",
                "Real-time order tracking with Supabase Realtime",
                "Digital token and secure 6-digit pickup OTP",
                "PDF upload with Supabase Storage",
                "Role-based access: Student / Owner / Admin",
                "Row Level Security on all database tables",
                "Dynamic cost calculator with priority pricing",
                "Payment abstraction (Pay at Shop / Online)",
                "Notifications system with real-time updates",
                "Print presets: Notes, Assignment, Exam",
                "Eco score tracking per order",
                "Admin analytics with Recharts charts",
                "Server-side authorization on all mutations",
                "Mobile-first responsive design",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-2 flex-shrink-0" />
                  <p className="text-slate-600 text-sm">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button size="xl" asChild>
              <Link href="/register">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/60 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Printer className="w-4 h-4 text-blue-400" />
          <span className="text-slate-900 font-semibold text-sm">
            PrintQueue <span className="text-lime-400">AI</span>
          </span>
        </div>
        <p className="text-slate-400 text-xs">Built for national-level hackathon. Full-stack with real Supabase backend.</p>
      </footer>
    </div>
  );
}


