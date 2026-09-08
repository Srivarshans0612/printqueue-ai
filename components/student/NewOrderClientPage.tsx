"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  Upload,
  FileText,
  X,
  Brain,
  CheckCircle,
  Clock,
  Star,
  Users,
  ArrowRight,
  ArrowLeft,
  Zap,
  Leaf,
  CreditCard,
  Smartphone,
  Building2,
  BookOpen,
  GraduationCap,
  Pen,
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
  { id: "notes", label: "Notes", icon: BookOpen, copies: 1, printType: "bw" as const, priority: "normal" as const },
  { id: "assignment", label: "Assignment", icon: Pen, copies: 1, printType: "bw" as const, priority: "normal" as const },
  { id: "exam", label: "Exam", icon: GraduationCap, copies: 2, printType: "bw" as const, priority: "express" as const },
];

export function NewOrderClientPage({ shops, locations, preSelectedShopId, userId }: NewOrderClientPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(preSelectedShopId ? "document" : "shop");
  const [loading, setLoading] = useState(false);

  // Step 1: Shop selection
  const [selectedShopId, setSelectedShopId] = useState(preSelectedShopId ?? "");
  const [deadline, setDeadline] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Step 2: Document
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentPath, setDocumentPath] = useState("");
  const [documentPages, setDocumentPages] = useState(10);

  // Step 3: Configure
  const [copies, setCopies] = useState(1);
  const [printType, setPrintType] = useState<"bw" | "color">("bw");
  const [priority, setPriority] = useState<"normal" | "express">("normal");
  const [notes, setNotes] = useState("");

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<"pay_at_shop" | "upi" | "debit_card" | "credit_card">("pay_at_shop");

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  // AI scored shops
  const scored = useMemo(() => scoreShops({
    shops: locationFilter ? shops.filter((s) => s.location_id === locationFilter) : shops,
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    pageCount: documentPages,
    copies,
  }), [shops, deadline, documentPages, copies, locationFilter]);

  const totalAmount = selectedShop
    ? calculateOrderAmount(documentPages, copies, printType, priority, selectedShop.price_bw, selectedShop.price_color, selectedShop.priority_multiplier)
    : 0;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB.");
      return;
    }
    setFile(f);

    // Upload to Supabase Storage
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("userId", userId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed");

      setDocumentPath(result.path);
      toast.success("Document uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setFile(null);
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setCopies(preset.copies);
    setPrintType(preset.printType);
    setPriority(preset.priority);
  };

  const handlePlaceOrder = async () => {
    if (!selectedShop || !documentPath || !file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("shop_id", selectedShop.id);
      formData.append("document_name", file.name);
      formData.append("document_path", documentPath);
      formData.append("document_pages", documentPages.toString());
      formData.append("copies", copies.toString());
      formData.append("print_type", printType);
      formData.append("priority", priority);
      formData.append("payment_method", paymentMethod);
      if (deadline) formData.append("deadline", new Date(deadline).toISOString());
      if (notes) formData.append("notes", notes);

      const { createOrder } = await import("@/actions/orders");
      const result = await createOrder(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Order placed! Token: ${result.token}`);
        router.push(`/student/orders/${result.order_id}`);
      }
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: "shop", label: "Shop" },
    { id: "document", label: "Document" },
    { id: "configure", label: "Configure" },
    { id: "payment", label: "Payment" },
    { id: "confirm", label: "Confirm" },
  ];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Print Order</h1>
        <p className="text-zinc-400 text-sm mt-1">Follow the steps below to place your order.</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === stepIndex
                ? "bg-blue-600 text-white"
                : i < stepIndex
                ? "bg-emerald-600/20 text-emerald-400"
                : "bg-zinc-800 text-zinc-500"
            }`}>
              {i < stepIndex ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
              {s.label}
            </div>
            {i < steps.length - 1 && <ArrowRight className="w-3 h-3 text-zinc-700 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 1: Shop Selection */}
      {step === "shop" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block">Filter by location</Label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block">Required by (deadline)</Label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {deadline && (
            <div className="flex items-center gap-2 bg-lime-500/10 border border-lime-500/20 rounded-lg px-4 py-3">
              <Brain className="w-4 h-4 text-lime-400" />
              <span className="text-lime-400 text-sm font-medium">
                AI is ranking shops by your deadline: {format(new Date(deadline), "h:mm a, MMM d")}
              </span>
            </div>
          )}

          <div className="grid gap-3">
            {scored.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No open shops available right now</p>
                <p className="text-zinc-600 text-sm mt-1">Try selecting a different location or check back later</p>
              </div>
            ) : scored.map(({ shop, recommendation }, index) => (
              <button
                key={shop.id}
                onClick={() => setSelectedShopId(shop.id)}
                className={`text-left transition-all rounded-xl border p-4 ${
                  selectedShopId === shop.id
                    ? "border-blue-600 bg-blue-600/10"
                    : recommendation.is_recommended
                    ? "border-lime-500/30 hover:border-lime-500/60"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{shop.name}</span>
                      {recommendation.is_recommended && (
                        <Badge variant="lime" className="text-[10px]">
                          <Brain className="w-2.5 h-2.5 mr-1" />AI Pick
                        </Badge>
                      )}
                      {index === 0 && !recommendation.is_recommended && (
                        <Badge variant="blue" className="text-[10px]">Top Rated</Badge>
                      )}
                    </div>
                    <p className="text-zinc-400 text-xs mb-2">{shop.address}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{shop.rating.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{shop.current_queue} queue</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Ready {format(new Date(recommendation.predicted_ready_at), "h:mm a")}</span>
                    </div>
                    {recommendation.is_recommended && recommendation.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {recommendation.reasons.slice(0, 3).map((r) => (
                          <span key={r} className="flex items-center gap-1 text-[10px] text-lime-400">
                            <CheckCircle className="w-2.5 h-2.5" />{r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-sm">₹{shop.price_bw}<span className="text-zinc-500 font-normal text-xs">/pg</span></p>
                    <p className="text-zinc-500 text-xs">B&W</p>
                    {selectedShopId === shop.id && (
                      <CheckCircle className="w-5 h-5 text-blue-400 ml-auto mt-1" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!selectedShopId}
            onClick={() => setStep("document")}
          >
            Continue with {selectedShop?.name ?? "selected shop"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Document Upload */}
      {step === "document" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Upload Document</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("shop")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-500/10"
                : file
                ? "border-emerald-600 bg-emerald-600/5"
                : "border-zinc-700 hover:border-zinc-500"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />

            {uploading ? (
              <div>
                <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">Uploading document...</p>
              </div>
            ) : file ? (
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-600/30 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-white font-medium text-sm">{file.name}</p>
                <p className="text-zinc-400 text-xs mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setDocumentPath(""); }}
                  className="mt-3 flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 mx-auto transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-white text-sm font-medium mb-1">Drop your PDF here</p>
                <p className="text-zinc-500 text-xs">or click to browse · PDF only · Max 20MB</p>
              </div>
            )}
          </div>

          {/* Page count */}
          <div>
            <Label className="mb-1.5 block">Number of pages in document</Label>
            <Input
              type="number"
              min={1}
              max={500}
              value={documentPages}
              onChange={(e) => setDocumentPages(parseInt(e.target.value) || 1)}
              className="max-w-xs"
            />
            <p className="text-zinc-500 text-xs mt-1">Enter the total pages in your document</p>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!file || !documentPath || uploading}
            onClick={() => setStep("configure")}
          >
            Continue to Configuration
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 3: Configure */}
      {step === "configure" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Print Configuration</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("document")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>

          {/* Presets */}
          <div>
            <Label className="mb-2 block">Quick Presets</Label>
            <div className="flex gap-3">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-zinc-700 hover:border-blue-600 hover:bg-blue-600/10 text-zinc-400 hover:text-blue-400 transition-all text-xs font-medium"
                  >
                    <Icon className="w-5 h-5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copies */}
          <div>
            <Label className="mb-2 block">Number of Copies</Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="w-10 h-10 rounded-lg border border-zinc-700 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
              >-</button>
              <span className="text-2xl font-bold text-white w-12 text-center">{copies}</span>
              <button
                onClick={() => setCopies(Math.min(50, copies + 1))}
                className="w-10 h-10 rounded-lg border border-zinc-700 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
              >+</button>
            </div>
          </div>

          {/* Print type */}
          <div>
            <Label className="mb-2 block">Print Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "bw" as const, label: "Black & White", desc: `₹${selectedShop?.price_bw}/page` },
                { value: "color" as const, label: "Color", desc: `₹${selectedShop?.price_color}/page` },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPrintType(opt.value)}
                  className={`flex flex-col gap-1 p-4 rounded-xl border text-left transition-all ${
                    printType === opt.value
                      ? "border-blue-600 bg-blue-600/10 text-blue-400"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  <span className="font-medium text-sm">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label className="mb-2 block">Priority</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "normal" as const, label: "Normal", desc: "Standard queue", icon: Clock },
                { value: "express" as const, label: "Express", desc: `${selectedShop?.priority_multiplier ?? 1.5}x price`, icon: Zap },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      priority === opt.value
                        ? "border-blue-600 bg-blue-600/10 text-blue-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs opacity-70">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="mb-1.5 block">Special instructions (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special printing instructions..."
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Cost preview */}
          <Card className="border-blue-600/20 bg-blue-600/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Order Summary</h3>
                <Badge variant="blue">{priority === "express" ? "Express" : "Normal"}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Pages</span>
                  <span className="text-white">{documentPages}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Copies</span>
                  <span className="text-white">×{copies}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Price per page</span>
                  <span className="text-white">₹{printType === "bw" ? selectedShop?.price_bw : selectedShop?.price_color}</span>
                </div>
                {priority === "express" && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Express multiplier</span>
                    <span className="text-amber-400">×{selectedShop?.priority_multiplier ?? 1.5}</span>
                  </div>
                )}
                <div className="border-t border-zinc-700 pt-2 flex justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-white text-lg">₹{totalAmount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-zinc-400">
                  Eco score: {documentPages * copies <= 10 ? "95" : documentPages * copies <= 50 ? "75" : "55"}/100
                </span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={() => setStep("payment")}>
            Continue to Payment
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === "payment" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Payment Method</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("configure")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>

          <div className="grid gap-3">
            {[
              { value: "pay_at_shop" as const, label: "Pay at Shop", desc: "Pay cash when you collect", icon: Building2 },
              { value: "upi" as const, label: "UPI", desc: "Demo mode", icon: Smartphone },
              { value: "debit_card" as const, label: "Debit Card", desc: "Demo mode", icon: CreditCard },
              { value: "credit_card" as const, label: "Credit Card", desc: "Demo mode", icon: CreditCard },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    paymentMethod === opt.value
                      ? "border-blue-600 bg-blue-600/10"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === opt.value ? "bg-blue-600" : "bg-zinc-800"
                  }`}>
                    <Icon className={`w-5 h-5 ${paymentMethod === opt.value ? "text-white" : "text-zinc-400"}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{opt.label}</p>
                    <p className="text-zinc-400 text-xs">{opt.desc}</p>
                  </div>
                  {paymentMethod === opt.value && (
                    <CheckCircle className="w-5 h-5 text-blue-400 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {paymentMethod !== "pay_at_shop" && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <span className="text-amber-400 text-xs">ℹ️</span>
              <p className="text-amber-300 text-xs">
                Online payment is in demo mode for this hackathon. A real gateway like Razorpay can be connected for production.
              </p>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={() => setStep("confirm")}>
            Review Order
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === "confirm" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Confirm Order</h2>
            <Button variant="ghost" size="sm" onClick={() => setStep("payment")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Shop</p>
                <p className="text-white font-semibold">{selectedShop?.name}</p>
                <p className="text-zinc-400 text-xs">{selectedShop?.address}</p>
              </div>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Document</p>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <p className="text-white text-sm font-medium">{file?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pages</p>
                  <p className="text-white font-medium">{documentPages}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Copies</p>
                  <p className="text-white font-medium">{copies}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Print Type</p>
                  <p className="text-white font-medium">{printType === "bw" ? "Black & White" : "Color"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Priority</p>
                  <p className="text-white font-medium capitalize">{priority}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Payment</p>
                <p className="text-white font-medium capitalize">{paymentMethod.replace(/_/g, " ")}</p>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                <p className="text-zinc-400 text-sm">Total Amount</p>
                <p className="text-white font-bold text-xl">₹{totalAmount}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-zinc-300 text-xs">
              After placing the order, you&apos;ll receive a digital token and a 6-digit pickup OTP. Keep the OTP private — share it only when collecting your document.
            </p>
          </div>

          <Button
            className="w-full"
            size="xl"
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Order...
              </div>
            ) : (
              <>
                Place Order · ₹{totalAmount}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
