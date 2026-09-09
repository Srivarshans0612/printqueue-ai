"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Clock, CheckCircle, Printer,
  ShoppingBag, MapPin, PartyPopper, XCircle,
} from "lucide-react";

// ─── Status definitions ───────────────────────────────────────────────────────

export type OrderStatus =
  | "order_placed"
  | "waiting_for_acceptance"
  | "accepted"
  | "preparing"
  | "ready"
  | "waiting_for_pickup"
  | "picked_up"
  | "rejected"
  | "cancelled";

// Map DB status string → our canonical status
export function mapDbStatus(dbStatus: string): OrderStatus {
  switch (dbStatus) {
    case "waiting_for_acceptance": return "waiting_for_acceptance";
    case "accepted":               return "accepted";
    case "preparing":              return "preparing";
    case "ready":                  return "ready";
    case "picked_up":              return "picked_up";
    case "rejected":               return "rejected";
    case "cancelled":              return "cancelled";
    default:                       return "waiting_for_acceptance";
  }
}

interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;        // icon bg color
  iconColor: string;    // icon fill/stroke
  ringColor: string;    // animated ring
  title: string;
  studentDesc: string;
  ownerDesc: string;
  animation: "pop" | "pulse" | "bounce" | "shake" | "spin" | "celebration";
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  order_placed: {
    icon: Package,
    color: "bg-blue-100",
    iconColor: "text-blue-600",
    ringColor: "ring-blue-400",
    title: "Order Placed Successfully",
    studentDesc: "Your order has been sent to the shop.",
    ownerDesc: "New order received.",
    animation: "pop",
  },
  waiting_for_acceptance: {
    icon: Clock,
    color: "bg-amber-100",
    iconColor: "text-amber-600",
    ringColor: "ring-amber-400",
    title: "Waiting for Acceptance",
    studentDesc: "Waiting for the shop to accept your order.",
    ownerDesc: "This order is awaiting your acceptance.",
    animation: "pulse",
  },
  accepted: {
    icon: CheckCircle,
    color: "bg-emerald-100",
    iconColor: "text-emerald-600",
    ringColor: "ring-emerald-400",
    title: "Order Accepted by Shop",
    studentDesc: "The shop accepted your order and will start printing soon.",
    ownerDesc: "Order accepted. You can now start printing.",
    animation: "pop",
  },
  preparing: {
    icon: Printer,
    color: "bg-violet-100",
    iconColor: "text-violet-600",
    ringColor: "ring-violet-400",
    title: "Printing in Progress",
    studentDesc: "Your document is being printed right now.",
    ownerDesc: "Printing in progress.",
    animation: "spin",
  },
  ready: {
    icon: ShoppingBag,
    color: "bg-green-100",
    iconColor: "text-green-700",
    ringColor: "ring-green-500",
    title: "Ready for Pickup! 🎉",
    studentDesc: "Your order is ready. Head to the shop with your OTP.",
    ownerDesc: "Order is ready. Waiting for student pickup.",
    animation: "bounce",
  },
  waiting_for_pickup: {
    icon: MapPin,
    color: "bg-sky-100",
    iconColor: "text-sky-600",
    ringColor: "ring-sky-400",
    title: "Waiting for Pickup",
    studentDesc: "Your order is waiting at the shop. Show your OTP.",
    ownerDesc: "Waiting for the student to arrive.",
    animation: "pulse",
  },
  picked_up: {
    icon: PartyPopper,
    color: "bg-indigo-100",
    iconColor: "text-indigo-600",
    ringColor: "ring-indigo-400",
    title: "Order Completed Successfully",
    studentDesc: "All done! Thanks for using PrintQueue AI.",
    ownerDesc: "Order picked up. Payment collected.",
    animation: "celebration",
  },
  rejected: {
    icon: XCircle,
    color: "bg-red-100",
    iconColor: "text-red-600",
    ringColor: "ring-red-400",
    title: "Order Rejected",
    studentDesc: "The shop was unable to accept your order.",
    ownerDesc: "Order has been rejected.",
    animation: "shake",
  },
  cancelled: {
    icon: XCircle,
    color: "bg-slate-100",
    iconColor: "text-slate-500",
    ringColor: "ring-slate-400",
    title: "Order Cancelled",
    studentDesc: "This order has been cancelled.",
    ownerDesc: "Order was cancelled.",
    animation: "shake",
  },
};

// ─── Timeline steps (in order) ───────────────────────────────────────────────

export const TIMELINE_STEPS: OrderStatus[] = [
  "order_placed",
  "waiting_for_acceptance",
  "accepted",
  "preparing",
  "ready",
  "picked_up",
];

function getTimelineIndex(status: OrderStatus): number {
  if (status === "rejected" || status === "cancelled") return -1;
  return TIMELINE_STEPS.indexOf(status);
}

// ─── Animation variants ──────────────────────────────────────────────────────

const popVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 15 } },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } },
};

const bounceVariants = {
  initial: { y: -30, opacity: 0 },
  animate: {
    y: [0, -12, 0, -6, 0],
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" },
  },
  exit: { y: 20, opacity: 0, transition: { duration: 0.2 } },
};

const shakeVariants = {
  initial: { x: 0, opacity: 0 },
  animate: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const celebrationVariants = {
  initial: { scale: 0.5, opacity: 0, rotate: -10 },
  animate: {
    scale: [1.2, 1],
    opacity: 1,
    rotate: [5, 0],
    transition: { type: "spring", stiffness: 300, damping: 12 },
  },
  exit: { scale: 0.8, opacity: 0 },
};

function pickVariant(animation: StatusConfig["animation"]) {
  switch (animation) {
    case "bounce":      return bounceVariants;
    case "shake":       return shakeVariants;
    case "celebration": return celebrationVariants;
    default:            return popVariants;
  }
}

// ─── Printer paper animation ─────────────────────────────────────────────────

function PrinterIcon({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Printer className="w-full h-full" />
      <motion.div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-slate-300 rounded-sm"
        animate={{ y: [0, 4, 0], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─── Particle burst (for celebration) ────────────────────────────────────────

function Particle({ i }: { i: number }) {
  const colors = ["bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-amber-400", "bg-pink-400"];
  const angle = (i / 8) * 360;
  const distance = 45 + Math.random() * 20;
  const rad = (angle * Math.PI) / 180;
  return (
    <motion.div
      className={`absolute w-2 h-2 rounded-full ${colors[i % colors.length]}`}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        opacity: 0,
        scale: 0,
      }}
      transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
    />
  );
}

// ─── Main OrderStatusAnimation component ────────────────────────────────────

interface OrderStatusAnimationProps {
  status: string;           // DB status string
  role: "student" | "owner";
  token?: string;
  rejectionReason?: string;
  showTimeline?: boolean;
  compact?: boolean;        // Smaller version for order lists
  /** If true, animation plays even on initial mount (e.g. status just changed) */
  isNewStatus?: boolean;
}

export function OrderStatusAnimation({
  status: dbStatus,
  role,
  token,
  rejectionReason,
  showTimeline = true,
  compact = false,
  isNewStatus = false,
}: OrderStatusAnimationProps) {
  const status = mapDbStatus(dbStatus);
  const config = STATUS_CONFIG[status];
  const Icon = status === "preparing" ? PrinterIcon : config.icon;
  const variant = pickVariant(config.animation);
  const timelineIdx = getTimelineIndex(status);
  const isPreparing = status === "preparing";
  const isCelebration = status === "picked_up";
  const [played, setPlayed] = useState(false);

  // Only play animation once per status change
  const prevStatus = useRef(dbStatus);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (prevStatus.current !== dbStatus) {
      prevStatus.current = dbStatus;
      setAnimKey((k) => k + 1);
      setPlayed(false);
    }
  }, [dbStatus]);

  const desc = role === "owner" ? config.ownerDesc : config.studentDesc;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          key={animKey}
          variants={popVariants}
          initial="initial"
          animate="animate"
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}
        >
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{config.title}</p>
          {token && <p className="text-xs text-slate-500">Order {token}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Status hero card ─────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl border-2 p-6 mb-5 ${
        status === "rejected" || status === "cancelled"
          ? "bg-red-50 border-red-200"
          : status === "picked_up"
          ? "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200"
          : status === "ready"
          ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300"
          : "bg-white border-slate-200"
      }`}>

        {/* Celebration particles */}
        {isCelebration && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {Array.from({ length: 8 }).map((_, i) => <Particle key={i} i={i} />)}
          </div>
        )}

        <div className="flex items-center gap-5">
          {/* Animated icon */}
          <motion.div
            key={`icon-${animKey}`}
            variants={variant}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative flex-shrink-0"
          >
            {/* Pulsing ring for waiting/pulse statuses */}
            {(config.animation === "pulse") && (
              <motion.div
                className={`absolute inset-0 rounded-full ring-4 ${config.ringColor}`}
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
            )}

            {/* Spinning ring for printing */}
            {isPreparing && (
              <motion.div
                className="absolute -inset-1.5 rounded-full border-4 border-violet-300 border-t-violet-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
            )}

            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${config.color} shadow-md`}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            key={`text-${animKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex-1 min-w-0"
          >
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight mb-1">
              {config.title}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
            {token && (
              <p className="text-xs font-bold text-slate-400 mt-1.5 font-mono tracking-wider">
                ORDER {token}
              </p>
            )}
            {status === "rejected" && rejectionReason && (
              <p className="text-red-600 text-xs mt-1.5 bg-red-50 rounded-lg px-3 py-1.5 inline-block">
                Reason: {rejectionReason}
              </p>
            )}
          </motion.div>

          {/* Live pulse dot for active statuses */}
          {!["picked_up", "rejected", "cancelled"].includes(status) && (
            <motion.div
              className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* ── Animated Timeline ─────────────────────────── */}
      {showTimeline && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
            Order Progress
          </p>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200" />
            {/* Progress fill */}
            {timelineIdx >= 0 && (
              <motion.div
                className="absolute left-5 top-5 w-0.5 bg-blue-500 origin-top"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  height: `${Math.min((timelineIdx / (TIMELINE_STEPS.length - 1)) * 100, 100)}%`,
                }}
              />
            )}

            <div className="space-y-4 relative">
              {TIMELINE_STEPS.map((stepStatus, idx) => {
                const stepConfig = STATUS_CONFIG[stepStatus];
                const StepIcon = stepStatus === "preparing" ? Printer : stepConfig.icon;
                const isDone   = timelineIdx > idx;
                const isActive = timelineIdx === idx;
                const isFuture = timelineIdx < idx;
                const isError  = (status === "rejected" || status === "cancelled") && idx === 1;

                return (
                  <motion.div
                    key={stepStatus}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.3 }}
                    className="flex items-center gap-4"
                  >
                    {/* Step dot */}
                    <div className="relative z-10 flex-shrink-0">
                      {isDone ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20, delay: idx * 0.08 }}
                          className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow"
                        >
                          <CheckCircle className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : isActive ? (
                        <div className="relative">
                          {/* Animated outer ring */}
                          <motion.div
                            className="absolute -inset-1.5 rounded-full border-2 border-blue-400"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                          />
                          <motion.div
                            key={`active-dot-${animKey}`}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${stepConfig.color}`}
                          >
                            <StepIcon className={`w-5 h-5 ${stepConfig.iconColor}`} />
                          </motion.div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                          <StepIcon className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-tight ${
                        isDone   ? "text-blue-600" :
                        isActive ? "text-slate-900" : "text-slate-400"
                      }`}>
                        {stepConfig.title}
                      </p>
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs text-slate-500 mt-0.5 leading-relaxed"
                        >
                          {role === "owner" ? stepConfig.ownerDesc : stepConfig.studentDesc}
                        </motion.p>
                      )}
                    </div>

                    {/* Active badge */}
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${stepConfig.color} ${stepConfig.iconColor}`}
                      >
                        Now
                      </motion.span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        Done
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {/* Rejected / Cancelled terminal state */}
              {(status === "rejected" || status === "cancelled") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className="relative z-10 w-10 h-10 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-600 capitalize">{status}</p>
                    {rejectionReason && (
                      <p className="text-xs text-red-400 mt-0.5">{rejectionReason}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-wider">
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

// ─── Status change toast (plays on the receiving side) ──────────────────────

export function showStatusChangeToast(status: string, role: "student" | "owner", token?: string) {
  const canonical = mapDbStatus(status);
  const config = STATUS_CONFIG[canonical];
  const desc = role === "owner" ? config.ownerDesc : config.studentDesc;

  // Use react-hot-toast with custom content
  const { toast } = require("react-hot-toast");
  toast.custom(
    (t: { visible: boolean }) => (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={t.visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-4 flex items-center gap-3 max-w-sm"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
          <config.icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 leading-tight">{config.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
          {token && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{token}</p>}
        </div>
      </motion.div>
    ),
    { duration: 5000, position: "top-right" }
  );
}
