"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { toggleShopOpen } from "@/actions/shops";
import { Badge } from "@/components/ui/badge";

interface ShopOpenToggleProps {
  shopId: string;
  isOpen: boolean;
}

export function ShopOpenToggle({ shopId, isOpen: initialOpen }: ShopOpenToggleProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const newState = !isOpen;
    setIsOpen(newState);

    const result = await toggleShopOpen(shopId, newState);
    if (result.error) {
      toast.error(result.error);
      setIsOpen(!newState);
    } else {
      toast.success(newState ? "Shop is now OPEN" : "Shop is now CLOSED");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant={isOpen ? "success" : "secondary"} className="text-sm px-3 py-1">
        {isOpen ? "OPEN" : "CLOSED"}
      </Badge>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
          isOpen ? "bg-emerald-500" : "bg-slate-300"
        }`}
        role="switch"
        aria-checked={isOpen}
        aria-label="Toggle shop open/closed"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            isOpen ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-slate-600 text-sm">{isOpen ? "Close shop" : "Open shop"}</span>
    </div>
  );
}
