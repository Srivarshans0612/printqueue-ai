"use client";

/**
 * OrderStatusAnimation — Phase 5, 12, 13
 *
 * Single source of truth for all order status visuals.
 * Uses ONLY canonical DB status values — no phantom statuses.
 * Animations respect prefers-reduced-motion.
 * Plays only when status actually changes, not on every render.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Package, Clock, CheckCircle, Printer,
  ShoppingBag, PartyPopper, XCircle, MapPin,
} from "lucide-react";

// ─── Canonical DB Status (matches orders.status CHECK constraint) ─────────────
export type CanonicalStatus =
  | "waiting_for_acceptance"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "rejected"
  | "cancelled";

// Map any string → canonical, with safe fallback
export function toCanonical(s: string): CanonicalStatus {
  const valid: CanonicalStatus[] = [
    "waiting_for_acceptance", "accepted", "preparing",
    "ready", "picked_up", "rejected", "cancelled",
  ];
  return valid.includes(s as CanonicalStatus)
    ? (s as CanonicalStatus)
    : "waiting_for_acceptance";
}

// Timeline order (for progress calculation)
export const TIMELINE: CanonicalStatus[] = [
  "waiting_for_acceptance",
  "accepted",
  "preparing",
  "ready",
  "picked_up",
];

export function timelineIndex(s: CanonicalStatus): number {
  return TIMELINE.indexOf(s); // -1 for rejected/cancelled
}

// ─── Status config ────────────────────────────────────────────────────────────
interface StatusConfig {
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconCls: string;
  ring: string;
  title: string;
  studentDesc: string;
  ownerDesc: string;
  anim: "pop" | "pulse" | "bounce" | "shake" | "celebration" | "spin";
}

export const STATUS_CONFIG: Record<CanonicalStatus, StatusConfig> = {
  waiting_for_acceptance: {
    Icon: Clock,
    bg: "bg-amber-100", iconCls: "text-amber-600", ring: "ring-amber-400",
    title: "Waiting for Acceptance",
    studentDesc: "Your order has been sent. Waiting for the shop to accept it.",
    ownerDesc: "New order awaiting your acceptance.",
    anim: "pulse",
  },
  accepted: {
    Icon: CheckCircle,
    bg: "bg-emerald-100", iconCls: "text-emerald-600", ring: "ring-emerald-400",
    title: "Order Accepted",
    studentDesc: "The shop accepted your order. Printing will begin shortly.",
    ownerDesc: "Order accepted. Ready to start printing.",
    anim: "pop",
  },
  preparing: {
    Icon: Printer,
    bg: "bg-violet-100", iconCls: "text-violet-600", ring: "ring-violet-400",
    title: "Printing in Progress",
    studentDesc: "Your document is being printed right now.",
    ownerDesc: "Printing in progress.",
    anim: "spin",
  },
  ready: {
    Icon: ShoppingBag,
    bg: "bg-green-100", iconCls: "text-green-700", ring: "ring-green-500",
    title: "Ready for Pickup! 🎉",
    studentDesc: "Your order is ready. Head to the shop with your OTP.",
    ownerDesc: "Order is ready. Waiting for student pickup.",
    anim: "bounce",
  },
  picked_up: {
    Icon: PartyPopper,
    bg: "bg-indigo-100", iconCls: "text-indigo-600", ring: "ring-indigo-400",
    title: "Order Completed",
    studentDesc: "All done! Thanks for using PrintQueue AI.",
    ownerDesc: "Order picked up successfully.",
    anim: "celebration",
  },
  rejected: {
    Icon: XCircle,
    bg: "bg-red-100", iconCls: "text-red-600", ring: "ring-red-400",
    title: "Order Rejected",
    studentDesc: "The shop could not accept your order.",
    ownerDesc: "Order rejected.",
    anim: "shake",
  },
  cancelled: {
    Icon: XCircle,
    bg: "bg-slate-100", iconCls: "text-slate-500", ring: "ring-slate-300",
    title: "Order Cancelled",
    studentDesc: "This order has been cancelled.",
    ownerDesc: "Order was cancelled.",
    anim: "shake",
  },
};

// ─── Animation variants (lightweight CSS transforms only) ─────────────────────
const popV = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 14 } },
  exit:    { scale: 0.8, opacity: 0, transition: { duration: 0.15 } },
};
const bounceV = {
  initial: { y: -20, opacity: 0 },
  animate: { y: [0, -10, 0, -4, 0], opacity: 1, transition: { duration: 0.7 } },
  exit:    { opacity: 0 },
};
const shakeV = {
  initial: { x: 0, opacity: 0 },
  animate: { x: [0, -8, 8, -6, 6, -3, 3, 0], opacity: 1, transition: { duration: 0.45 } },
  exit:    { opacity: 0 },
};
const celebrationV = {
  initial: { scale: 0.6, opacity: 0, rotate: -8 },
  animate: { scale: [1.15, 1], opacity: 1, rotate: [4, 0], transition: { type: "spring", stiffness: 280, damping: 12 } },
  exit:    { opacity: 0 },
};

function pickVariant(anim: StatusConfig["anim"], reduced: boolean) {
  if (reduced) return popV; // always use simple pop for reduced-motion
  switch (anim) {
    case "bounce":      return bounceV;
    case "shake":       return shakeV;
    case "celebration": return celebrationV;
    default:            return popV;
  }
}

// ─── Confetti burst (celebration only, skipped for reduced-motion) ────────────
function Confetti() {
  const colors = ["bg-blue-400","bg-violet-400","bg-emerald-400","bg-amber-400","bg-pink-400"];
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * 360;
        const rad = (angle * Math.PI) / 180;
        const d = 45;
        return (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${colors[i % colors.length]}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(rad) * d, y: Math.sin(rad) * d, opacity: 0, scale: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
interface OrderStatusAnimationProps {
  status: string;
  role: "student" | "owner";
  token?: string;
  rejectionReason?: string;
  showTimeline?: boolean;
  compact?: boolean;
}

export function OrderStatusAnimation({
  status: rawStatus,
  role,
  token,
  rejectionReason,
  showTimeline = true,
  compact = false,
}: OrderStatusAnimationProps) {
  const status  = toCanonical(rawStatus);
  const cfg     = STATUS_CONFIG[status];
  const reduced = useReducedMotion() ?? false;
  const variant = pickVariant(cfg.anim, reduced);

  // animKey increments only when status actually changes → forces remount of icon/text
  const prevRef = useRef(status);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (prevRef.current !== status) {
      prevRef.current = status;
      setAnimKey((k) => k + 1);
    }
  }, [status]);

  const desc = role === "owner" ? cfg.ownerDesc : cfg.studentDesc;
  const idx  = timelineIndex(status);
  const isTerminal = status === "rejected" || status === "cancelled" || status === "picked_up";

  /* ── Compact card (used in order lists) ──────────────────────── */
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          key={`compact-${animKey}`}
          variants={popV}
          initial="initial"
          animate="animate"
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
        >
          <cfg.Icon className={`w-5 h-5 ${cfg.iconCls}`} />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">{cfg.title}</p>
          {token && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{token}</p>}
        </div>
      </div>
    );
  }

  /* ── Full hero card ───────────────────────────────────────────── */
  return (
    <div className="w-full space-y-4">
      {/* Hero status card */}
      <div className={`relative overflow-hidden rounded-2xl border-2 p-5 ${
        status === "rejected" || status === "cancelled" ? "bg-red-50 border-red-200" :
        status === "picked_up" ? "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200" :
        status === "ready"     ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300" :
        "bg-white border-slate-200"
      }`}>
        {status === "picked_up" && !reduced && <Confetti />}

        <div className="flex items-center gap-4 relative z-10">
          {/* Animated icon */}
          <motion.div
            key={`icon-${animKey}`}
            variants={variant}
            initial="initial"
            animate="animate"
            className="relative flex-shrink-0"
          >
            {/* Pulse ring */}
            {cfg.anim === "pulse" && !reduced && (
              <motion.div
                className={`absolute inset-0 rounded-full ring-4 ${cfg.ring}`}
                animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            {/* Spinner ring for printing */}
            {cfg.anim === "spin" && !reduced && (
              <motion.div
                className="absolute -inset-1.5 rounded-full border-4 border-violet-200 border-t-violet-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              />
            )}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${cfg.bg}`}>
              <cfg.Icon className={`w-7 h-7 ${cfg.iconCls}`} />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            key={`text-${animKey}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.28 }}
            className="flex-1 min-w-0"
          >
            <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{cfg.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed mt-0.5">{desc}</p>
            {token && (
              <p className="text-[10px] font-black font-mono text-slate-400 mt-1.5 tracking-widest uppercase">
                Order {token}
              </p>
            )}
            {(status === "rejected" || status === "cancelled") && rejectionReason && (
              <p className="text-red-600 text-xs mt-1.5 bg-red-50 rounded-lg px-2.5 py-1.5 inline-block border border-red-100">
                {rejectionReason}
              </p>
            )}
          </motion.div>

          {/* Live pulse dot for non-terminal */}
          {!isTerminal && (
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"
              animate={reduced ? {} : { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* Timeline */}
      {showTimeline && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
            Order Progress
          </p>

          <div className="relative">
            {/* Background track */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200" />
            {/* Progress fill */}
            {idx >= 0 && (
              <motion.div
                className="absolute left-5 top-5 w-0.5 bg-blue-500 origin-top"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ height: `${(Math.min(idx, TIMELINE.length - 1) / (TIMELINE.length - 1)) * 100}%` }}
              />
            )}

            <div className="space-y-2 relative">
              {TIMELINE.map((step, i) => {
                const stepCfg = STATUS_CONFIG[step];
                const done    = idx > i;
                const active  = idx === i;
                return (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.22 }}
                    className="flex items-center gap-3"
                  >
                    {/* Step dot */}
                    <div className="relative z-10 flex-shrink-0">
                      {done ? (
                        <motion.div
                          initial={reduced ? false : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20, delay: i * 0.06 }}
                          className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-sm"
                        >
                          <CheckCircle className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : active ? (
                        <div className="relative">
                          {!reduced && (
                            <motion.div
                              className="absolute -inset-1.5 rounded-full border-2 border-blue-400"
                              animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
                              transition={{ duration: 1.8, repeat: Infinity }}
                            />
                          )}
                          <motion.div
                            key={`adot-${animKey}`}
                            initial={reduced ? false : { scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 380, damping: 14 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${stepCfg.bg}`}
                          >
                            <stepCfg.Icon className={`w-5 h-5 ${stepCfg.iconCls}`} />
                          </motion.div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                          <stepCfg.Icon className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1 py-2 min-w-0">
                      <p className={`text-sm font-bold leading-tight ${
                        done ? "text-blue-600" : active ? "text-slate-900" : "text-slate-400"
                      }`}>
                        {stepCfg.title}
                      </p>
                      {active && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs text-slate-500 mt-0.5 leading-relaxed"
                        >
                          {role === "owner" ? stepCfg.ownerDesc : stepCfg.studentDesc}
                        </motion.p>
                      )}
                    </div>

                    {active && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${stepCfg.bg} ${stepCfg.iconCls}`}
                      >
                        Now
                      </motion.span>
                    )}
                    {done && <span className="text-[10px] font-bold text-blue-500 uppercase">✓</span>}
                  </motion.div>
                );
              })}

              {/* Rejected / cancelled terminal */}
              {(status === "rejected" || status === "cancelled") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-3"
                >
                  <div className="relative z-10 w-10 h-10 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="py-2">
                    <p className="text-sm font-bold text-red-600 capitalize">{status.replace("_", " ")}</p>
                    {rejectionReason && (
                      <p className="text-xs text-red-400 mt-0.5">{rejectionReason}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-wider ml-auto">
                    Final
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
