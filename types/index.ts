export type UserRole = "student" | "owner" | "admin";

export type OrderStatus =
  | "waiting_for_acceptance"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "rejected"
  | "cancelled";

export type PaymentMethod = "pay_at_shop" | "upi" | "debit_card" | "credit_card";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PrintType = "bw" | "color";
export type Priority = "normal" | "express";
export type ShopStatus = "pending" | "approved" | "rejected" | "disabled";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  location_id: string;
  name: string;
  address: string;
  description?: string;
  price_bw: number;
  price_color: number;
  priority_multiplier: number;
  is_open: boolean;
  status: ShopStatus;
  rating: number;
  total_reviews: number;
  current_queue: number;
  avg_completion_minutes: number;
  max_daily_orders: number;
  phone?: string;
  created_at: string;
  updated_at: string;
  location?: Location;
  owner?: Profile;
}

export interface ShopRequest {
  id: string;
  owner_id: string;
  location_id: string;
  shop_name: string;
  address: string;
  description?: string;
  price_bw: number;
  price_color: number;
  phone?: string;
  status: "pending" | "approved" | "rejected";
  admin_note?: string;
  created_at: string;
  updated_at: string;
  location?: Location;
  owner?: Profile;
}

export interface Order {
  id: string;
  token: string;
  student_id: string;
  shop_id: string;
  document_name: string;
  document_path: string;
  document_pages: number;
  copies: number;
  print_type: PrintType;
  priority: Priority;
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  pickup_otp?: string;
  otp_verified: boolean;
  estimated_ready_at?: string;
  deadline?: string;
  notes?: string;
  eco_score?: number;
  created_at: string;
  updated_at: string;
  shop?: Shop;
  student?: Profile;
  payment?: Payment;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  gateway_response?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  order_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  student_id: string;
  shop_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface PrintPreset {
  id: string;
  student_id: string;
  name: string;
  label: string;
  icon: string;
  copies: number;
  print_type: PrintType;
  priority: Priority;
  created_at: string;
}

export interface AIRecommendation {
  shop_id: string;
  shop_name: string;
  score: number;
  confidence: number;
  predicted_ready_at: string;
  reasons: string[];
  is_recommended: boolean;
  explanation: string;
}

export interface ShopWithRecommendation extends Shop {
  recommendation?: AIRecommendation;
}

export interface DashboardStats {
  total_students: number;
  total_owners: number;
  total_shops: number;
  pending_shops: number;
  active_orders: number;
  completed_orders: number;
  total_revenue: number;
  total_locations: number;
}

export interface OrderAnalytics {
  date: string;
  orders: number;
  revenue: number;
}

export interface ShopAnalytics {
  shop_name: string;
  orders: number;
  revenue: number;
}
