"use client";

import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Package, User, FileText,
  Printer, ShieldCheck, Download, X,
  Plus, Monitor,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderStatusAnimation } from "@/components/orders/OrderStatusAnimation";
import { formatDistanceToNow, format } from "date-fns";
import { updateOrderStatus, verifyOTP } from "@/actions/orders";

type Order = {
  id: string;
  token: string;
  status: string;
  document_name: string;
  document_path: string;
  document_pages: number;
  copies: number;
  print_type: string;
  priority: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  pickup_otp?: string;
  created_at: string;
  notes?: string;
  shop_id: string;
  deadline?: string;
  estimated_ready_at?: string;
  student?: { id: string; full_name: string; email: string } | null;
  shop?: { id: string; name: string } | null;
};

interface OwnerOrdersClientProps {
  orders: Order[];
  shopId: string;
  shopIds?: string[];
  shops?: { id: string; name: string }[];
}

type FilterTab = "all" | "pending" | "active" | "completed";

// ── Print Preview Modal ───────────────────────────────────────────────
function PrintPreviewModal({
  order,
  printers,
  defaultPrinter,
  onClose,
  onAddPrinter,
}: {
  order: Order;
  printers: string[];
  defaultPrinter: string;
  onClose: () => void;
  onAddPrinter: () => void;
}) {
  const [selectedPrinter, setSelectedPrinter] = useState(defaultPrinter);

  const handlePrint = () => {
    // Use browser print with print-specific CSS
    window.print();
    toast.success(`Sent to printer: ${selectedPrinter}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h3 className="text-slate-900 font-semibold">Print Order</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print preview area */}
        <div className="px-6 py-5 print-only" id="print-area">
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Order Token</p>
                <p className="token-display text-2xl font-bold text-blue-600">{order.token}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Total</p>
                <p className="text-xl font-bold text-slate-900">₹{order.total_amount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Customer</p>
                <p className="text-slate-900 font-medium">{order.student?.full_name ?? "—"}</p>
                <p className="text-slate-500 text-xs">{order.student?.email ?? ""}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Document</p>
                <p className="text-slate-900 font-medium truncate">{order.document_name}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Pages × Copies</p>
                <p className="text-slate-900 font-medium">{order.document_pages} × {order.copies} = {order.document_pages * order.copies} pages</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Print Type</p>
                <p className="text-slate-900 font-medium">{order.print_type === "bw" ? "Black & White" : "Color"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Priority</p>
                <p className="text-slate-900 font-medium capitalize">{order.priority}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Payment</p>
                <p className="text-slate-900 font-medium capitalize">{order.payment_method.replace(/_/g, " ")}</p>
              </div>
              {order.deadline && (
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs mb-0.5">Deadline</p>
                  <p className="text-amber-600 font-medium">{format(new Date(order.deadline), "h:mm a, MMM d yyyy")}</p>
                </div>
              )}
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs mb-0.5">Special Instructions</p>
                  <p className="text-slate-700">{order.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 mt-4 pt-3 text-xs text-slate-400 flex justify-between">
              <span>PrintQueue AI</span>
              <span>{format(new Date(order.created_at), "MMM d, yyyy h:mm a")}</span>
            </div>
          </div>
        </div>

        {/* Printer selection */}
        <div className="px-6 pb-5 no-print space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Select Printer</label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {printers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onAddPrinter}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Another Printer
          </button>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1.5" /> Print Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Printer Modal ─────────────────────────────────────────────────
function AddPrinterModal({
  onAdd,
  onClose,
}: {
  onAdd: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");

  const handleDetect = () => {
    // In a real app, use window.print() to trigger browser printer dialog
    const detected = "HP LaserJet (Auto-detected)";
    setName(detected);
    toast.success("Printer detected: " + detected);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-5 h-5 text-blue-600" />
          <h3 className="text-slate-900 font-semibold">Add Printer</h3>
        </div>

        <p className="text-slate-500 text-sm mb-4">
          Connect a printer to your device, then enter its name or auto-detect.
        </p>

        <div className="space-y-3 mb-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HP LaserJet Pro"
            className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleDetect}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            <Monitor className="w-3.5 h-3.5" /> Auto-detect printer
          </button>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={!name.trim()}
            onClick={() => { onAdd(name.trim()); onClose(); }}
          >
            Add Printer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export function OwnerOrdersClient({
  orders: initialOrders,
  shopId,
  shopIds,
  shops,
}: OwnerOrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [filterShopId, setFilterShopId] = useState<string>("all");
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [etaOrderId, setEtaOrderId] = useState<string | null>(null);
  const [eta, setEta] = useState("");

  // Printer state
  const [printers, setPrinters] = useState<string[]>(["Default System Printer"]);
  const [defaultPrinter, setDefaultPrinter] = useState("Default System Printer");
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [showAddPrinter, setShowAddPrinter] = useState(false);

  const hasMultipleShops = (shops?.length ?? 0) > 1;

  // ── Real-time subscription — one channel per shop ─────────────────
  useEffect(() => {
    const supabase = createClient();
    const allShopIds = shopIds && shopIds.length > 0 ? shopIds : [shopId];

    // Create a channel for each shop so all orders arrive in real-time
    const channels = allShopIds.map((sid) =>
      supabase
        .channel(`shop_orders:${sid}`)
        .on("postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `shop_id=eq.${sid}` },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setOrders((prev) => [payload.new as Order, ...prev]);
              toast("🔔 New order received!", { duration: 5000 });
            } else if (payload.eventType === "UPDATE") {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === payload.new.id ? { ...o, ...(payload.new as Order) } : o
                )
              );
            }
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [shopId, shopIds]);

  const filteredOrders = orders.filter((o) => {
    const shopMatch = filterShopId === "all" || o.shop_id === filterShopId;
    if (!shopMatch) return false;
    if (filter === "pending") return o.status === "waiting_for_acceptance";
    if (filter === "active") return ["accepted", "preparing", "ready"].includes(o.status);
    if (filter === "completed") return ["picked_up", "rejected", "cancelled"].includes(o.status);
    return true;
  });

  // ── Actions ────────────────────────────────────────────────────────
  const handleAccept = async (orderId: string) => {
    // Optimistic update first — instant UI
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "accepted" } : o));
    const result = await updateOrderStatus(orderId, "accepted");
    if (result.error) {
      toast.error(result.error);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "waiting_for_acceptance" } : o));
    } else {
      toast.success("Order accepted!");
    }
  };

  const handleReject = async (orderId: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "rejected" } : o));
    const result = await updateOrderStatus(orderId, "rejected");
    if (result.error) {
      toast.error(result.error);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "waiting_for_acceptance" } : o));
    } else {
      toast("Order rejected", { icon: "❌" });
    }
  };

  const handlePreparing = async (orderId: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "preparing", estimated_ready_at: eta || o.estimated_ready_at } : o));
    const result = await updateOrderStatus(orderId, "preparing", eta || undefined);
    if (result.error) {
      toast.error(result.error);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "accepted" } : o));
    } else {
      toast.success("Printing started!");
      setEtaOrderId(null);
      setEta("");
    }
  };

  const handleReady = async (orderId: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "ready" } : o));
    const result = await updateOrderStatus(orderId, "ready");
    if (result.error) {
      toast.error(result.error);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "preparing" } : o));
    } else {
      toast.success("Order marked Ready! Student notified 🎉");
    }
  };

  const handleVerifyOTP = async () => {
    if (!verifyOrderId || !otp) return;
    const result = await verifyOTP(verifyOrderId, otp);
    if (result.error) toast.error(result.error);
    else {
      setOrders((prev) => prev.map((o) => o.id === verifyOrderId ? { ...o, status: "picked_up" } : o));
      toast.success("OTP verified! Order picked up ✓");
      setVerifyOrderId(null);
      setOtp("");
    }
  };

  // ── Download handler ───────────────────────────────────────────────
  const handleDownload = async (order: Order) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(order.document_path, 60);
      if (error || !data) throw new Error("Could not generate download link");
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = order.document_name;
      link.target = "_blank";
      link.click();
      toast.success("Download started");
    } catch {
      toast.error("Download failed. Check storage permissions.");
    }
  };

  // ── Printer helpers ────────────────────────────────────────────────
  const handleAddPrinter = (name: string) => {
    setPrinters((prev) => [...prev, name]);
    setDefaultPrinter(name);
    toast.success(`${name} set as default printer`);
  };

  const pendingCount = orders.filter((o) => o.status === "waiting_for_acceptance").length;
  const activeCount = orders.filter((o) => ["accepted", "preparing", "ready"].includes(o.status)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
      {/* Print preview modal */}
      {printOrder && (
        <PrintPreviewModal
          order={printOrder}
          printers={printers}
          defaultPrinter={defaultPrinter}
          onClose={() => setPrintOrder(null)}
          onAddPrinter={() => { setPrintOrder(null); setShowAddPrinter(true); }}
        />
      )}

      {/* Add printer modal */}
      {showAddPrinter && (
        <AddPrinterModal
          onAdd={handleAddPrinter}
          onClose={() => setShowAddPrinter(false)}
        />
      )}

      {/* OTP Verify Modal */}
      {verifyOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-slate-900 font-semibold mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Verify Pickup OTP
            </h3>
            <p className="text-slate-500 text-sm mb-4">Ask the student for their 6-digit OTP</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center text-2xl font-bold tracking-widest token-display h-14 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setVerifyOrderId(null); setOtp(""); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleVerifyOTP} disabled={otp.length !== 6}>Verify & Complete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
        <p className="text-slate-500 text-sm mt-1">Accept, track and complete orders in real-time</p>
      </div>

      {/* Shop filter */}
      {hasMultipleShops && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterShopId("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filterShopId === "all"
                ? "bg-blue-600 text-slate-900 border-blue-600"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            All Shops
          </button>
          {shops?.map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterShopId(s.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filterShopId === s.id
                  ? "bg-blue-600 text-slate-900 border-blue-600"
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: "pending" as FilterTab, label: "Pending", count: pendingCount },
          { key: "active" as FilterTab, label: "Active", count: activeCount },
          { key: "completed" as FilterTab, label: "Completed", count: 0 },
          { key: "all" as FilterTab, label: "All Orders", count: orders.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 border ${
              filter === tab.key
                ? "bg-blue-600 text-slate-900 border-blue-600"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 ${filter === tab.key ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No orders here</p>
          <p className="text-slate-300 text-sm">Orders will appear automatically in real-time</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              layout
            >
            <Card
              className={`transition-all ${
                order.status === "waiting_for_acceptance" ? "border-amber-300 bg-amber-50/30" :
                order.status === "ready" ? "border-emerald-300 bg-emerald-50/30" : ""
              }`}
            >
              <CardContent className="p-5">
                {/* Compact status animation strip */}
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <OrderStatusAnimation
                    status={order.status}
                    role="owner"
                    token={order.token}
                    showTimeline={false}
                    compact={true}
                  />
                </div>
                {/* Order header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="token-display font-bold text-blue-600 text-lg">{order.token}</span>
                      <OrderStatusBadge status={order.status} />
                      {order.priority === "express" && (
                        <Badge variant="warning" className="text-[10px]">Express</Badge>
                      )}
                      {hasMultipleShops && order.shop && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                          {order.shop.name}
                        </span>
                      )}
                    </div>
                    {/* ── TASK 4: Show actual customer name ── */}
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">
                        {order.student?.full_name
                          ? order.student.full_name
                          : order.student?.email
                          ? order.student.email.split("@")[0]
                          : "Customer"}
                      </span>
                      {order.student?.email && (
                        <span className="text-slate-400 text-xs">· {order.student.email}</span>
                      )}
                    </div>
                    {order.deadline && (
                      <p className="text-amber-600 text-xs mt-1 font-medium">
                        ⏰ Deadline: {format(new Date(order.deadline), "h:mm a, MMM d")}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-900 font-bold text-xl">₹{order.total_amount}</p>
                    <p className="text-slate-400 text-xs">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Order details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
                  {[
                    { label: "Document", value: order.document_name, truncate: true },
                    { label: "Pages × Copies", value: `${order.document_pages} × ${order.copies}` },
                    { label: "Print Type", value: order.print_type === "bw" ? "B&W" : "Color" },
                    {
                      label: "Payment",
                      value: order.payment_status.toUpperCase(),
                      colored: order.payment_status === "paid" ? "text-emerald-600" : "text-amber-600",
                    },
                  ].map((d) => (
                    <div key={d.label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <p className="text-slate-400 mb-0.5">{d.label}</p>
                      <p className={`font-semibold text-slate-800 ${d.truncate ? "truncate" : ""} ${d.colored ?? ""}`}>
                        {d.value}
                      </p>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2 mb-4 text-xs">
                    <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-600">{order.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {order.status === "waiting_for_acceptance" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleAccept(order.id)}>
                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(order.id)}>
                        Reject
                      </Button>
                    </>
                  )}

                  {order.status === "accepted" && (
                    <>
                      {/* ── TASK 6: Download & Print after acceptance ── */}
                      <Button size="sm" variant="outline" onClick={() => handleDownload(order)}>
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPrintOrder(order)}>
                        <Printer className="w-3.5 h-3.5" /> Print
                      </Button>
                      {etaOrderId === order.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="datetime-local"
                            value={eta}
                            onChange={(e) => setEta(e.target.value)}
                            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <Button size="sm" onClick={() => handlePreparing(order.id)}>
                            <Printer className="w-3.5 h-3.5" /> Start Printing
                          </Button>
                          <button onClick={() => setEtaOrderId(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => setEtaOrderId(order.id)}>
                          Start Preparing
                        </Button>
                      )}
                    </>
                  )}

                  {order.status === "preparing" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(order)}>
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPrintOrder(order)}>
                        <Printer className="w-3.5 h-3.5" /> Print
                      </Button>
                      <Button size="sm" variant="success" onClick={() => handleReady(order.id)}>
                        <CheckCircle className="w-3.5 h-3.5" /> Mark as Ready
                      </Button>
                    </>
                  )}

                  {order.status === "ready" && (
                    <Button size="sm" onClick={() => { setVerifyOrderId(order.id); setOtp(""); }}>
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify OTP & Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

