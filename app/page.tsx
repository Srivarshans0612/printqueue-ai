import Link from "next/link";
import {
  Printer,
  Clock,
  Zap,
  CheckCircle,
  ArrowRight,
  Brain,
  QrCode,
  CreditCard,
  BarChart3,
  Leaf,
  Shield,
  Smartphone,
  Timer,
  AlertCircle,
  TrendingUp,
  Users,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/navbar/PublicNav";

const stats = [
  { label: "Campus Locations", value: "4+" },
  { label: "Approved Shops", value: "10+" },
  { label: "Orders Served", value: "5K+" },
  { label: "Avg Wait Reduction", value: "60%" },
];

const problems = [
  { icon: Clock, text: "Long physical queues at printing shops" },
  { icon: AlertCircle, text: "No idea if the shop is open or busy" },
  { icon: ShoppingBag, text: "Uncertainty about cost before visiting" },
  { icon: Timer, text: "No way to know when documents will be ready" },
];

const steps = [
  { step: "01", title: "Select Location", desc: "Choose your campus area and browse approved printing shops nearby." },
  { step: "02", title: "AI Recommends", desc: "Our AI analyzes queue, price, rating, and your deadline to recommend the best shop." },
  { step: "03", title: "Upload & Configure", desc: "Upload your PDF, choose pages, copies, and print type. See live cost calculation." },
  { step: "04", title: "Place Order", desc: "Pay online or at shop. Get your digital token and pickup OTP instantly." },
  { step: "05", title: "Live Tracking", desc: "Track your order in real-time. Get notified when it's ready." },
  { step: "06", title: "Pickup", desc: "Visit the shop, verify with your OTP, collect your documents." },
];

const studentFeatures = [
  { icon: Brain, title: "AI Shop Recommendation", desc: "Smart matching based on queue, price, rating, and your deadline." },
  { icon: Zap, title: "Instant Cost Calculation", desc: "Know exactly what you'll pay before placing an order." },
  { icon: QrCode, title: "Digital Token & OTP", desc: "No paper tokens. Secure pickup verification with a unique OTP." },
  { icon: Clock, title: "Real-time Tracking", desc: "Watch your order progress from accepted to ready — live." },
  { icon: Smartphone, title: "Mobile First", desc: "Works perfectly on any device. Order printing from anywhere on campus." },
  { icon: Leaf, title: "Eco Score", desc: "Track your environmental impact. Smart printing, better planet." },
];

const ownerFeatures = [
  { icon: BarChart3, title: "Order Dashboard", desc: "Manage incoming orders, set ETAs, and update statuses efficiently." },
  { icon: Shield, title: "OTP Verification", desc: "Secure pickup verification prevents incorrect document handover." },
  { icon: TrendingUp, title: "Analytics", desc: "Daily revenue, popular times, and workload visibility." },
  { icon: Users, title: "Digital Workflow", desc: "Move away from paper chits to a fully digital order management system." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PublicNav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-zinc-950 to-zinc-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-lime-500/8 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <Badge variant="lime" className="mb-6 text-xs px-3 py-1">
            <Brain className="w-3 h-3 mr-1" />
            AI-Powered Campus Printing
          </Badge>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
            Don&apos;t join<br />
            <span className="gradient-text">the queue.</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            PrintQueue AI connects students with approved campus print shops
            and turns uncertain waiting into a predictable pickup experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="xl" asChild className="font-semibold">
              <Link href="/register">
                Start Printing Smarter
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card px-4 py-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="destructive" className="mb-4">The Problem</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Campus printing is broken
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Every student has wasted time at printing shops. The experience is frustrating, unpredictable, and completely unnecessary.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {problems.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.text} className="glass-card flex items-center gap-4 p-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-zinc-300 text-sm">{p.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="blue" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Six steps to smarter printing
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              From selecting a shop to picking up your documents — the entire flow is digital, fast, and predictable.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.step} className="glass-card p-6 group hover:border-blue-600/40 transition-colors">
                <div className="text-3xl font-bold text-blue-600/30 mb-3 group-hover:text-blue-600/50 transition-colors">
                  {step.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Smart Match */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="lime" className="mb-4">
                <Brain className="w-3 h-3 mr-1" />
                AI Smart Match
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                The right shop, every time
              </h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Our AI recommendation engine considers queue length, waiting time, distance, shop workload, price, rating, your deadline, and predicted completion time — then explains its choice.
              </p>
              <div className="space-y-3">
                {[
                  "Lowest predicted waiting time",
                  "Open now & within your deadline",
                  "High rating & competitive price",
                  "Natural language explanation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-lime-400 flex-shrink-0" />
                    <span className="text-zinc-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Card mockup */}
            <div className="glass-card ai-glow p-6 border-lime-500/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-lime-400 pulse-dot" />
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">
                  AI Recommendation
                </span>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Print</h3>
                  <p className="text-zinc-400 text-sm">Rathinam Campus, Block A</p>
                </div>
                <Badge variant="lime" className="text-xs">Best Match</Badge>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  "Lowest predicted waiting time",
                  "Open now",
                  "Within your deadline",
                  "High rating (4.8★)",
                  "Moderate price (₹1.5/page)",
                ].map((reason) => (
                  <div key={reason} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
                    <span className="text-zinc-300 text-xs">{reason}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 mb-1">Predicted ready</p>
                  <p className="text-white font-semibold text-sm">12:38 PM</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 mb-1">AI confidence</p>
                  <p className="text-lime-400 font-semibold text-sm">92%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Features */}
      <section className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="blue" className="mb-4">For Students</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need, nothing you don&apos;t
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-card p-6 hover:border-blue-600/40 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Shop Owner Features */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="warning" className="mb-4">For Shop Owners</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Digital workflow. Better business.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ownerFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-card p-5 hover:border-amber-500/30 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-colors">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-white font-medium text-sm mb-1.5">{f.title}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Tracking section */}
      <section className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="success" className="mb-4">Real-time Tracking</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Watch your order progress live
          </h2>
          <p className="text-zinc-400 mb-12 max-w-xl mx-auto">
            Every status change is instant. When the shop owner updates your order, your dashboard updates in real-time — no refreshing required.
          </p>

          {/* Order timeline mockup */}
          <div className="glass-card p-8 max-w-sm mx-auto text-left">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-5">
              Order PQ2048 — Live Status
            </p>

            {[
              { label: "Order Placed", done: true },
              { label: "Accepted by Shop", done: true },
              { label: "Printing in Progress", done: false, active: true },
              { label: "Ready for Pickup", done: false },
              { label: "Picked Up", done: false },
            ].map((step, i) => (
              <div key={step.label} className="flex items-start gap-3 mb-4 last:mb-0">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done
                    ? "bg-emerald-600"
                    : step.active
                    ? "bg-blue-600 ring-2 ring-blue-600/30"
                    : "bg-zinc-800 border border-zinc-700"
                }`}>
                  {step.done && <CheckCircle className="w-3 h-3 text-white" />}
                  {step.active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <span className={`text-sm font-medium ${
                    step.done ? "text-emerald-400" : step.active ? "text-slate-900" : "text-zinc-500"
                  }`}>
                    {step.label}
                  </span>
                  {step.active && (
                    <p className="text-xs text-zinc-400 mt-0.5">Estimated ready: 12:38 PM</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="purple" className="mb-4">Payment</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Pay your way
          </h2>
          <p className="text-zinc-400 mb-12 max-w-xl mx-auto">
            Choose to pay at the shop or pay online. UPI, debit card, credit card — all options available.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {["Pay at Shop", "UPI", "Debit Card", "Credit Card"].map((method) => (
              <div key={method} className="glass-card flex items-center gap-2 px-5 py-3">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-zinc-300">{method}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-950/40 via-zinc-950 to-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to print smarter?
          </h2>
          <p className="text-zinc-400 mb-8 text-lg">
            Join students who have already left the queue behind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild className="font-semibold">
              <Link href="/register">
                Create Student Account
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/register">Register Your Shop</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="text-white font-semibold text-sm">
              PrintQueue <span className="text-lime-400">AI</span>
            </span>
          </div>
          <p className="text-zinc-500 text-xs">
            © 2026 PrintQueue AI. Built for the national hackathon.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

