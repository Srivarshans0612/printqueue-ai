import { PaymentMethod, PaymentStatus } from "@/types";

export interface PaymentIntent {
  order_id: string;
  amount: number;
  method: PaymentMethod;
  currency?: string;
}

export interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  status: PaymentStatus;
  error?: string;
  gateway_response?: Record<string, unknown>;
}

/**
 * Payment abstraction layer.
 * Currently implements a demo mode.
 * To connect Razorpay or another gateway, implement the gateway branch below.
 */
export async function processPayment(intent: PaymentIntent): Promise<PaymentResult> {
  const { method } = intent;

  // Pay at shop — no gateway needed
  if (method === "pay_at_shop") {
    return {
      success: true,
      transaction_id: undefined,
      status: "pending", // Payment pending until collected at shop
      gateway_response: { note: "Cash payment at shop" },
    };
  }

  // Online payment — check for real gateway config
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;

  if (razorpayKeyId) {
    // TODO: Integrate Razorpay SDK here when ready for production
    // const Razorpay = require("razorpay");
    // const instance = new Razorpay({ key_id: razorpayKeyId, key_secret: process.env.RAZORPAY_KEY_SECRET });
    // ...
    return {
      success: false,
      status: "failed",
      error: "Payment gateway not fully configured. Please pay at shop.",
    };
  }

  // Demo mode — simulate successful payment for hackathon
  const demoTransactionId = `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  return {
    success: true,
    transaction_id: demoTransactionId,
    status: "paid",
    gateway_response: {
      mode: "demo",
      note: "This is a demo payment. Connect Razorpay for production.",
      method,
    },
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateOrderAmount(
  pages: number,
  copies: number,
  printType: "bw" | "color",
  priority: "normal" | "express",
  priceBw: number,
  priceColor: number,
  priorityMultiplier: number
): number {
  const pricePerPage = printType === "color" ? priceColor : priceBw;
  const base = pages * copies * pricePerPage;
  const multiplier = priority === "express" ? priorityMultiplier : 1;
  return Math.round(base * multiplier);
}
