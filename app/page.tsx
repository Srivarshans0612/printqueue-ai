import Link from "next/link";
import {
  Printer, Clock, Zap, CheckCircle, ArrowRight,
  Brain, QrCode, CreditCard, BarChart3, Leaf,
  Shield, Smartphone, AlertCircle, TrendingUp,
  Users, ShoppingBag, Timer, Star, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/navbar/PublicNav";

/* ── Data ─────────────────────────────────────────────── */
const stats = [
  { value: "4+",  label: "Campus Locations" },
  { value: "10+", label: "Approved Shops"   },
  { value: "5K+", label: "Orders Served"    },
  { value: "60%", label: "Wait Reduction"   },
];

const problems = [
  { icon: Clock,       text: "Long physical queues at printing shops"         },
  { icon: AlertCircle, text: "No idea if the shop is open or how busy it is"  },
  { icon: ShoppingBag, text: "Uncertain cost before visiting the shop"        },
  { icon: Timer,       text: "No way to know when your documents will be ready"},
];

const steps = [
  { n: "1", title: "Select Location",    desc: "Browse approved shops near your campus area."                             },
  { n: "2", title: "AI Recommends",      desc: "AI ranks shops by queue, price, rating and your deadline."               },
  { n: "3", title: "Upload & Configure", desc: "Upload PDF, pick pages, copies and print type. See live cost."           },
  { n: "4", title: "Place Order",        desc: "Pay online or at shop. Receive digital token + pickup OTP instantly."    },
  { n: "5", title: "Live Tracking",      desc: "Track status in real-time. Get notified the moment it's ready."          },
  { n: "6", title: "Pickup",             desc: "Visit the shop, verify OTP, collect your documents. Done."               },
];

const studentFeatures = [
  { icon: Brain,       color: "bg-blue-100 text-blue-600",   title: "AI Shop Matching",        desc: "Smart ranking based on queue, price, rating and your deadline."        },
  { icon: Zap,         color: "bg-violet-100 text-violet-600", title: "Instant Cost Preview",  desc: "Know exactly what you'll pay before placing the order."                },
  { icon: QrCode,      color: "bg-emerald-100 text-emerald-600", title: "Digital Token + OTP", desc: "No paper tokens. Secure 6-digit OTP for verified pickup."             },
  { icon: Clock,       color: "bg-amber-100 text-amber-600", title: "Real-time Tracking",      desc: "Watch status change live — accepted, printing, ready. No refresh."    },
  { icon: Smartphone,  color: "bg-pink-100 text-pink-600",   title: "Mobile First",            desc: "Works perfectly on every device. Order from anywhere on campus."      },
  { icon: Leaf,        color: "bg-lime-100 text-lime-700",   title: "Eco Score",               desc: "Track your environmental footprint. Smarter printing, better planet." },
];

const ownerFeatures = [
  { icon: BarChart3, title: "Live Order Dashboard", desc: "Accept, track and complete orders in one place."     },
  { icon: Shield,    title: "OTP Verification",     desc: "Secure pickup. No wrong handovers."                 },
  { icon: TrendingUp,title: "Revenue Analytics",    desc: "Daily earnings, workload and completion insights."  },
  { icon: Users,     title: "Digital Workflow",     desc: "Replace paper chits with a clean digital system."   },
];

/* ── Component ─────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNav />

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Soft gradient blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-8">
            <Brain className="w-3.5 h-3.5" />
            AI-Powered Campus Printing
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 leading-[1.08] mb-6 tracking-tight">
            Don&apos;t join<br />
            <span className="gradient-text">the queue.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            PrintQueue AI connects students with approved campus print shops
            and turns uncertain waiting into a predictable pickup experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" asChild className="text-base px-8 shadow-lg shadow-blue-200">
              <Link href="/register">
                Start Printing Smarter <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-center shadow-sm">
                <p className="text-2xl font-black text-blue-600 mb-0.5">{s.value}</p>
                <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM ════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-red-100 text-red-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              The Problem
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              Campus printing is broken
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">
              Every student has wasted time at printing shops. The experience is frustrating, unpredictable, and completely unnecessary.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {problems.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.text} className="bg-white border border-red-100 rounded-2xl flex items-center gap-4 p-5 shadow-sm">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-slate-700 text-sm font-semibold">{p.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════ */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              Six steps to smarter printing
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">
              Entirely digital. From selecting a shop to collecting your documents.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className="group relative bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 transition-all hover:shadow-md"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4 shadow-sm">
                  {step.n}
                </div>
                <h3 className="text-slate-900 font-bold text-base mb-1.5">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI SMART MATCH ═════════════════════════════════ */}
      <section id="features" className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5" /> AI Smart Match
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight">
                The right shop,<br />every time.
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed font-medium">
                Our AI considers queue length, waiting time, shop workload, price, rating, your deadline, and predicted completion time — then explains its choice in plain language.
              </p>
              <div className="space-y-3">
                {[
                  "Lowest predicted waiting time",
                  "Open now & within your deadline",
                  "High rating & competitive price",
                  "Natural language explanation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI mockup card */}
            <div className="bg-white border-2 border-violet-200 rounded-2xl p-6 shadow-lg shadow-violet-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  AI Recommendation
                </span>
              </div>

              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Quick Print</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <p className="text-slate-500 text-xs font-medium">Rathinam Campus, Block A</p>
                  </div>
                </div>
                <span className="bg-violet-100 text-violet-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Best Match
                </span>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  "Lowest predicted waiting time",
                  "Open now",
                  "Within your deadline",
                  "High rating (4.8 ★)",
                  "Affordable price (₹1.5/page)",
                ].map((r) => (
                  <div key={r} className="flex items-center gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-600 text-xs font-semibold">{r}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Predicted ready</p>
                  <p className="text-slate-900 font-black text-sm">12:38 PM</p>
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
                  <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider mb-0.5">AI confidence</p>
                  <p className="text-violet-700 font-black text-sm">92%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STUDENT FEATURES ═══════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              For Students
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              Everything you need
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">
              Built for students who value their time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {studentFeatures.map((f) => {
              const Icon = f.icon;
              const [bg, text] = f.color.split(" ");
              return (
                <div key={f.title} className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 transition-all hover:shadow-md">
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${text}`} />
                  </div>
                  <h3 className="text-slate-900 font-bold text-base mb-1.5">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ OWNER FEATURES ═════════════════════════════════ */}
      <section className="py-20 px-4 bg-amber-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              For Shop Owners
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              Digital workflow. Better business.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ownerFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border-2 border-amber-100 hover:border-amber-300 rounded-2xl p-5 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-sm mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ LIVE TRACKING MOCKUP ════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                Real-time Tracking
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight">
                Watch your order<br />progress live.
              </h2>
              <p className="text-slate-600 mb-6 font-medium leading-relaxed">
                Every status change appears instantly on your screen — no refreshing. When the shop starts printing, you see it. When it&apos;s ready, you get notified immediately.
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-700 font-bold">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Powered by Supabase Realtime
              </div>
            </div>

            {/* Timeline mockup */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-md max-w-sm mx-auto lg:mx-0">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Order PQ2048</p>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>

              {[
                { label: "Order Placed",        done: true,  active: false },
                { label: "Accepted by Shop",    done: true,  active: false },
                { label: "Printing in Progress",done: false, active: true  },
                { label: "Ready for Pickup",    done: false, active: false },
                { label: "Picked Up",           done: false, active: false },
              ].map((step, i) => (
                <div key={step.label} className="flex items-start gap-3 mb-3 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done   ? "bg-emerald-500"  :
                      step.active ? "bg-blue-600 ring-4 ring-blue-100" :
                                    "bg-slate-100 border-2 border-slate-200"
                    }`}>
                      {step.done   && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      {step.active && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {i < 4 && (
                      <div className={`w-0.5 h-5 mt-1 ${step.done ? "bg-emerald-300" : "bg-slate-200"}`} />
                    )}
                  </div>
                  <div className="pt-0.5 pb-2">
                    <p className={`text-sm font-bold ${
                      step.done   ? "text-emerald-600"  :
                      step.active ? "text-slate-900"    : "text-slate-400"
                    }`}>
                      {step.label}
                    </p>
                    {step.active && (
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Est. ready: 12:38 PM</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PAYMENT ═════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-slate-200 text-slate-700 text-xs font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            Payment
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Pay your way</h2>
          <p className="text-slate-500 mb-10 max-w-xl mx-auto font-medium">
            Cash at shop or pay online. UPI, debit card, credit card — all options available.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: ShoppingBag, label: "Pay at Shop", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
              { icon: Smartphone,  label: "UPI",         color: "bg-blue-100 text-blue-700 border-blue-200"          },
              { icon: CreditCard,  label: "Debit Card",  color: "bg-violet-100 text-violet-700 border-violet-200"    },
              { icon: CreditCard,  label: "Credit Card", color: "bg-amber-100 text-amber-700 border-amber-200"       },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className={`flex items-center gap-2.5 border-2 rounded-2xl px-5 py-3 font-bold text-sm ${m.color}`}>
                  <Icon className="w-4 h-4" />
                  {m.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900">Loved by students</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: "Arjun K.", role: "Engineering Student",   text: "No more wasting 30 minutes at the print shop. I order from class and pick up when it's ready!"          },
              { name: "Priya M.", role: "MBA Student",           text: "The AI recommendation is spot on. It always picks the fastest shop within my deadline."                 },
              { name: "Ravi S.", role: "B.Sc Computer Science",  text: "The live tracking is incredible. I saw my order go from 'printing' to 'ready' in real time."            },
            ].map((t) => (
              <div key={t.name} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4 font-medium">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-slate-900 font-bold text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs font-medium">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 to-violet-600">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
            <Printer className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Ready to print smarter?
          </h2>
          <p className="text-blue-100 mb-10 text-lg font-medium">
            Join students who have already left the queue behind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-white text-blue-700 hover:bg-blue-50 font-black text-base px-8 shadow-xl">
              <Link href="/register">
                Create Student Account <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-2 border-white/50 text-white hover:bg-white/10 font-bold text-base px-8">
              <Link href="/register">Register Your Shop</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════ */}
      <footer className="bg-slate-900 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Printer className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white text-lg">
                PrintQueue <span className="text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium">
              Don&apos;t join the queue. Smart campus printing powered by AI.
            </p>
            <div className="flex items-center gap-5 text-xs font-semibold text-slate-400">
              <Link href="/about"    className="hover:text-white transition-colors">About</Link>
              <Link href="/login"    className="hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-slate-600 text-xs font-medium">
              © 2026 PrintQueue AI. Built for the national hackathon — RTC2025BAI198
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
