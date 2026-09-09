"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  Upload, FileText, X, Brain, CheckCircle,
  Clock, Star, Users, ArrowRight, ArrowLeft,
  Zap, Leaf, CreditCard, Smartphone, Building2,
  BookOpen, GraduationCap, Pen, Calendar,
} from "lucide-react";
import { Shop, Location } from "@/types";
import { scoreShops } from "@/lib/ai/recommendShop";
import { calculateOrderAmount } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface NewOrderClientPageProps {
  shops: Shop[];
  locations: Location[];
  preSelectedShopId?: string;
  userId: string;
}

type Step = "shop" | "document" | "configure" | "payment" | "confirm";

const PRESETS = [
  { id: "notes",      label: "📚 Notes",      icon: BookOpen,      copies: 1, printType: "bw"    as const, priority: "normal"  as const },
  { id: "assignment", label: "📝 Assignment", icon: Pen,           copies: 1, printType: "bw"    as const, priority: "normal"  as const },
  { id: "exam",       label: "🎓 Exam",       icon: GraduationCap, copies: 2, printType: "bw"    as const, priority: "express" as const },
];

const STEP_LIST = [
  { id: "shop",      label: "Shop" },
  { id: "document",  label: "Document" },
  { id: "configure", label: "Configure" },
  { id: "payment",   label: "Payment" },
  { id: "confirm",   label: "Confirm" },
];

export function NewOrderClientPage({
  shops, locations, preSelectedShopId, userId,
}: NewOrderClientPageProps) {
  const router = useRouter();
  const [step, setStep]     = useState<Step>(preSelectedShopId ? "document" : "shop");
  const [loading, setLoading] = useState(false);

  /* ── Step 1: Shop ───────────────────────────────────── */
  const [selectedShopId, setSelectedShopId] = useState(preSelectedShopId ?? "");
  const [deadline, setDeadline]             = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  /* ── Step 2: Document ───────────────────────────────── */
  const [file, setFile]               = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [documentPath, setDocumentPath] = useState("");
  const [documentPages, setDocumentPages] = useState(10);

  /* ── Step 3: Configure ──────────────────────────────── */
  const [copies, setCopies]       = useState(1);
  const [printType, setPrintType] = useState<"bw" | "color">("bw");
  const [priority, setPriority]   = useState<"normal" | "express">("normal");
  const [notes, setNotes]         = useState("");
  // Task 5: preferred delivery date & time
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  /* ── Step 4: Payment ────────────────────────────────── */
  const [paymentMethod, setPaymentMethod] =
    useState<"pay_at_shop" | "upi" | "debit_card" | "credit_card">("pay_at_shop");

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  const scored = useMemo(() => scoreShops({
    shops: locationFilter ? shops.filter((s) => s.location_id === locationFilter) : shops,
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    pageCount: documentPages,
    copies,
  }), [shops, deadline, documentPages, copies, locationFilter]);

  const totalAmount = selectedShop
    ? calculateOrderAmount(
        documentPages, copies, printType, priority,
        selectedShop.price_bw, selectedShop.price_color,
        selectedShop.priority_multiplier
      )
    : 0;

  /* ── Upload ─────────────────────────────────────────── */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    if (f.type !== "application/pdf") { toast.error("Only PDF files accepted."); return; }
    if (f.size > 20 * 1024 * 1024)   { toast.error("File must be under 20MB."); return; }
    setFile(f);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("userId", userId);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDocumentPath(data.path);
      toast.success("Document uploaded ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setFile(null);
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1, disabled: uploading,
  });

  const applyPreset = (p: typeof PRESETS[0]) => {
    setCopies(p.copies); setPrintType(p.printType); setPriority(p.priority);
  };

  /* ── Place order ────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    if (!selectedShop || !documentPath || !file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("shop_id",        selectedShop.id);
      fd.append("document_name",  file.name);
      fd.append("document_path",  documentPath);
      fd.append("document_pages", documentPages.toString());
      fd.append("copies",         copies.toString());
      fd.append("print_type",     printType);
      fd.append("priority",       priority);
      fd.append("payment_method", paymentMethod);
      if (deadline) fd.append("deadline", new Date(deadline).toISOString());

      // Build combined notes: user notes + preferred date/time
      let combinedNotes = notes.trim();
      if (preferredDate || preferredTime) {
        const dtStr = [preferredDate, preferredTime].filter(Boolean).join(" at ");
        combinedNotes = combinedNotes
          ? `${combinedNotes}\n📅 Preferred delivery: ${dtStr}`
          : `📅 Preferred delivery: ${dtStr}`;
      }
      if (combinedNotes) fd.append("notes", combinedNotes);

      const { createOrder } = await import("@/actions/orders");
      const result = await createOrder(fd);
      if (result.error) { toast.error(result.error); }
      else {
        toast.success(`Order placed! Token: ${result.token}`);
        router.push(`/student/orders/${result.order_id}`);
      }
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = STEP_LIST.findIndex((s) => s.id === step);

  /* ── Shared styles ──────────────────────────────────── */
  const selectCls = "w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const sectionTitle = "text-lg font-bold text-slate-900";
  const card = (active: boolean, extra = "") =>
    `rounded-xl border p-4 text-left transition-all cursor-pointer ${
      active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-400 bg-white"
    } ${extra}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Print Order</h1>
        <p className="text-slate-500 text-sm mt-1">Complete the steps below to place your order.</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEP_LIST.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              i === stepIndex ? "bg-blue-600 text-white shadow-sm" :
              i < stepIndex  ? "bg-emerald-100 text-emerald-700" :
                               "bg-slate-100 text-slate-400"
            }`}>
              {i < stepIndex ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
              {s.label}
            </div>
            {i < STEP_LIST.length - 1 && (
              <ArrowRight className={`w-3 h-3 flex-shrink-0 ${i < stepIndex ? "text-emerald-400" : "text-slate-300"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ═══════════════ STEP 1: SHOP ═══════════════════════ */}
      {step === "shop" && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block">Filter by location</Label>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className={selectCls}>
                <option value="">All Locations</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block">Required by (deadline)</Label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={selectCls}
              />
            </div>
          </div>

          {deadline && (
            <div className="flex items-center gap-2 bg-lime-50 border border-lime-200 rounded-lg px-4 py-3">
              <Brain className="w-4 h-4 text-lime-600" />
              <span className="text-lime-700 text-sm font-medium">
                AI is ranking shops for your deadline: {format(new Date(deadline), "h:mm a, MMM d")}
              </span>
            </div>
          )}

          {/* Shop cards */}
          <div className="grid gap-3">
            {scored.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No open shops right now</p>
              </div>
            ) : scored.map(({ shop, recommendation }, index) => (
              <button
                key={shop.id}
                onClick={() => setSelectedShopId(shop.id)}
                className={card(selectedShopId === shop.id, recommendation.is_recommended ? "border-lime-300" : "")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-slate-900 font-semibold">{shop.name}</span>
                      {recommendation.is_recommended && (
                        <Badge variant="lime" className="text-[10px]">
                          <Brain className="w-2.5 h-2.5 mr-1" />AI Pick
                        </Badge>
                      )}
                      {index === 0 && !recommendation.is_recommended && (
                        <Badge variant="blue" className="text-[10px]">Top Rated</Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{shop.address}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{shop.rating.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{shop.current_queue} in queue</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Ready ~{format(new Date(recommendation.predicted_ready_at), "h:mm a")}</span>
                    </div>
                    {recommendation.is_recommended && recommendation.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {recommendation.reasons.slice(0, 3).map((r) => (
                          <span key={r} className="flex items-center gap-1 text-[10px] text-lime-600 bg-lime-50 px-1.5 py-0.5 rounded-full">
                            <CheckCircle className="w-2.5 h-2.5" />{r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-900 font-bold text-sm">₹{shop.price_bw}<span className="text-slate-400 font-normal text-xs">/pg</span></p>
                    <p className="text-slate-400 text-xs">B&W</p>
                    {selectedShopId === shop.id && <CheckCircle className="w-5 h-5 text-blue-600 ml-auto mt-1" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button className="w-full" size="lg" disabled={!selectedShopId} onClick={() => setStep("document")}>
            Continue with {selectedShop?.name ?? "selected shop"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ═══════════════ STEP 2: DOCUMENT ═══════════════════ */}
      {step === "document" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className={sectionTitle}>Upload Document</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("shop")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" :
              file          ? "border-emerald-400 bg-emerald-50" :
                             "border-slate-300 hover:border-slate-400 bg-white"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Uploading…</p>
              </>
            ) : file ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-slate-900 font-medium text-sm">{file.name}</p>
                <p className="text-slate-400 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setDocumentPath(""); }}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />Remove
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-700 text-sm font-medium mb-1">Drop your PDF here</p>
                <p className="text-slate-400 text-xs">or click to browse · PDF only · Max 20MB</p>
              </>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">Number of pages in document</Label>
            <Input type="number" min={1} max={500} value={documentPages}
              onChange={(e) => setDocumentPages(parseInt(e.target.value) || 1)} className="max-w-xs" />
          </div>

          <Button className="w-full" size="lg" disabled={!file || !documentPath || uploading} onClick={() => setStep("configure")}>
            Continue to Configuration <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ═══════════════ STEP 3: CONFIGURE ══════════════════ */}
      {step === "configure" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={sectionTitle}>Print Configuration</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("document")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          </div>

          {/* Presets */}
          <div>
            <Label className="mb-2 block">Quick Presets</Label>
            <div className="flex gap-3">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                return (
                  <button key={p.id} onClick={() => applyPreset(p)}
                    className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all text-xs font-medium bg-white">
                    <Icon className="w-5 h-5" />{p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copies */}
          <div>
            <Label className="mb-2 block">Number of Copies</Label>
            <div className="flex items-center gap-3">
              <button onClick={() => setCopies(Math.max(1, copies - 1))}
                className="w-10 h-10 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-lg">−</button>
              <span className="text-2xl font-bold text-slate-900 w-12 text-center">{copies}</span>
              <button onClick={() => setCopies(Math.min(50, copies + 1))}
                className="w-10 h-10 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-lg">+</button>
            </div>
          </div>

          {/* Print type */}
          <div>
            <Label className="mb-2 block">Print Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "bw"    as const, label: "⬛ Black & White", desc: `₹${selectedShop?.price_bw}/page` },
                { value: "color" as const, label: "🎨 Color",         desc: `₹${selectedShop?.price_color}/page` },
              ]).map((opt) => (
                <button key={opt.value} onClick={() => setPrintType(opt.value)}
                  className={card(printType === opt.value)}>
                  <p className="font-semibold text-sm text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label className="mb-2 block">Priority</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "normal"  as const, label: "Normal",  desc: "Standard queue", icon: Clock },
                { value: "express" as const, label: "Express", desc: `${selectedShop?.priority_multiplier ?? 1.5}x price`, icon: Zap },
              ]).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} onClick={() => setPriority(opt.value)}
                    className={card(priority === opt.value, "flex items-center gap-3")}>
                    <Icon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TASK 5: Preferred Date & Time ───────────────── */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <Label className="text-blue-700 font-semibold">Preferred Pickup Date & Time</Label>
              <span className="text-xs text-blue-400">(optional)</span>
            </div>
            <p className="text-slate-500 text-xs">
              Choose when you&apos;d like to collect your printouts. The shop owner will try to have it ready by then.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-slate-600">Preferred Date</Label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-slate-600">Preferred Time</Label>
                <input
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {(preferredDate || preferredTime) && (
              <div className="flex items-center justify-between">
                <p className="text-blue-700 text-xs font-medium">
                  📅 Preferred: {[preferredDate, preferredTime].filter(Boolean).join(" at ")}
                </p>
                <button
                  onClick={() => { setPreferredDate(""); setPreferredTime(""); }}
                  className="text-slate-400 hover:text-red-500 text-xs flex items-center gap-1"
                >
                  <X className="w-3 h-3" />Clear
                </button>
              </div>
            )}
          </div>

          {/* Special instructions */}
          <div>
            <Label className="mb-1.5 block">Special instructions (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. staple pages, use both sides..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Cost summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-900 font-semibold">Order Summary</h3>
                <Badge variant={priority === "express" ? "warning" : "blue"}>
                  {priority === "express" ? "Express" : "Normal"}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  ["Pages", documentPages],
                  ["Copies", `×${copies}`],
                  ["Price / page", `₹${printType === "bw" ? selectedShop?.price_bw : selectedShop?.price_color}`],
                  ...(priority === "express" ? [["Express multiplier", `×${selectedShop?.priority_multiplier ?? 1.5}`]] : []),
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between text-slate-500">
                    <span>{k}</span><span className="text-slate-800 font-medium">{v}</span>
                  </div>
                ))}
                <div className="border-t border-blue-200 pt-2 flex justify-between font-bold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-blue-600 text-xl">₹{totalAmount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                Eco score: {documentPages * copies <= 10 ? "95" : documentPages * copies <= 50 ? "75" : "55"}/100
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={() => setStep("payment")}>
            Continue to Payment <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ═══════════════ STEP 4: PAYMENT ════════════════════ */}
      {step === "payment" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className={sectionTitle}>Payment Method</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("configure")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          </div>

          <div className="grid gap-3">
            {([
              { value: "pay_at_shop"  as const, label: "Pay at Shop",  desc: "Pay cash when you collect",  icon: Building2  },
              { value: "upi"          as const, label: "UPI",          desc: "Demo mode for hackathon",    icon: Smartphone },
              { value: "debit_card"   as const, label: "Debit Card",   desc: "Demo mode for hackathon",    icon: CreditCard },
              { value: "credit_card"  as const, label: "Credit Card",  desc: "Demo mode for hackathon",    icon: CreditCard },
            ]).map((opt) => {
              const Icon = opt.icon;
              return (
                <button key={opt.value} onClick={() => setPaymentMethod(opt.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all bg-white ${
                    paymentMethod === opt.value ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-400"
                  }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMethod === opt.value ? "bg-blue-600" : "bg-slate-100"}`}>
                    <Icon className={`w-5 h-5 ${paymentMethod === opt.value ? "text-white" : "text-slate-500"}`} />
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium text-sm">{opt.label}</p>
                    <p className="text-slate-400 text-xs">{opt.desc}</p>
                  </div>
                  {paymentMethod === opt.value && <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />}
                </button>
              );
            })}
          </div>

          {paymentMethod !== "pay_at_shop" && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              ℹ️ Online payment is in demo mode. Connect Razorpay for production.
            </div>
          )}

          <Button className="w-full" size="lg" onClick={() => setStep("confirm")}>
            Review Order <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ═══════════════ STEP 5: CONFIRM ════════════════════ */}
      {step === "confirm" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className={sectionTitle}>Confirm Order</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("payment")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          </div>

          <Card>
            <CardContent className="p-5 divide-y divide-slate-100 space-y-0">
              {[
                { label: "Shop",     body: <><p className="text-slate-900 font-semibold">{selectedShop?.name}</p><p className="text-slate-400 text-xs">{selectedShop?.address}</p></> },
                { label: "Document", body: <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /><p className="text-slate-800 text-sm font-medium">{file?.name}</p></div> },
                { label: "Details",  body: (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[["Pages", documentPages], ["Copies", copies], ["Type", printType === "bw" ? "B&W" : "Color"], ["Priority", priority]].map(([k,v]) => (
                      <div key={k as string}><p className="text-slate-400 text-xs">{k}</p><p className="text-slate-800 font-medium capitalize">{v as string}</p></div>
                    ))}
                  </div>
                )},
                ...(preferredDate || preferredTime ? [{
                  label: "Preferred Pickup",
                  body: <p className="text-blue-600 text-sm font-medium">📅 {[preferredDate, preferredTime].filter(Boolean).join(" at ")}</p>
                }] : []),
                { label: "Payment",  body: <p className="text-slate-800 font-medium capitalize">{paymentMethod.replace(/_/g, " ")}</p> },
              ].map(({ label, body }) => (
                <div key={label} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                  {body}
                </div>
              ))}
              <div className="py-3 flex items-center justify-between">
                <p className="text-slate-500 font-medium">Total</p>
                <p className="text-blue-600 font-bold text-2xl">₹{totalAmount}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            After placing, you&apos;ll receive a digital token and 6-digit pickup OTP. Keep the OTP private.
          </div>

          <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Order…
              </span>
            ) : <>Place Order · ₹{totalAmount} <ArrowRight className="w-5 h-5" /></>}
          </Button>
        </div>
      )}
    </div>
  );
}
