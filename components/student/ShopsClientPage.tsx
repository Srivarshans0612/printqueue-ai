"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Star,
  Clock,
  Users,
  ArrowRight,
  Brain,
  CheckCircle,
  Search,
  MapPin,
} from "lucide-react";
import { Shop } from "@/types";
import { scoreShops, ScoredShop } from "@/lib/ai/recommendShop";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface ShopsClientPageProps {
  shops: Shop[];
  locations: { id: string; name: string }[];
  selectedLocationId?: string;
  selectedLocationName?: string;
  initialSort?: string;
}

type SortOption = "best" | "fastest" | "cheapest" | "rated" | "queue";

export function ShopsClientPage({
  shops,
  locations,
  selectedLocationId,
  selectedLocationName,
  initialSort = "best",
}: ShopsClientPageProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>(initialSort as SortOption);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [deadline, setDeadline] = useState("");

  const scored = useMemo(() => {
    return scoreShops({
      shops,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      pageCount: 20,
      copies: 1,
    });
  }, [shops, deadline]);

  const sorted = useMemo(() => {
    let list = [...scored];

    if (showOnlyOpen) {
      list = list.filter((s) => s.shop.is_open);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.shop.name.toLowerCase().includes(q) ||
          s.shop.address.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "fastest":
        list.sort((a, b) => a.shop.current_queue - b.shop.current_queue);
        break;
      case "cheapest":
        list.sort((a, b) => a.shop.price_bw - b.shop.price_bw);
        break;
      case "rated":
        list.sort((a, b) => b.shop.rating - a.shop.rating);
        break;
      case "queue":
        list.sort((a, b) => a.shop.current_queue - b.shop.current_queue);
        break;
      default: // best
        list.sort((a, b) => b.recommendation.score - a.recommendation.score);
    }

    return list;
  }, [scored, sort, showOnlyOpen, search]);

  const topShop = scored.find((s) => s.recommendation.is_recommended);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <Link href="/student/locations" className="hover:text-white">
            Locations
          </Link>
          <span>/</span>
          <span className="text-slate-900">{selectedLocationName ?? "All Shops"}</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {selectedLocationName ? `${selectedLocationName} Shops` : "All Printing Shops"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {shops.length} approved {shops.length === 1 ? "shop" : "shops"} found
        </p>
      </div>

      {/* AI Recommendation banner */}
      {topShop && (
        <div className="glass-card ai-glow border-lime-500/20 p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Brain className="w-4 h-4 text-lime-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">
                  AI Recommendation
                </span>
                <Badge variant="lime" className="text-[10px]">
                  {topShop.recommendation.confidence}% confidence
                </Badge>
              </div>
              <h3 className="text-slate-900 font-bold text-lg leading-tight">{topShop.shop.name}</h3>
              <p className="text-slate-600 text-sm mt-1">{topShop.recommendation.explanation}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {topShop.recommendation.reasons.slice(0, 4).map((r) => (
                  <div key={r} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CheckCircle className="w-3 h-3 text-lime-400" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Predicted ready</p>
                  <p className="text-slate-900 text-sm font-semibold">
                    {format(new Date(topShop.recommendation.predicted_ready_at), "h:mm a")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Queue</p>
                  <p className="text-slate-900 text-sm font-semibold">{topShop.shop.current_queue} orders</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">B&W Price</p>
                  <p className="text-slate-900 text-sm font-semibold">₹{topShop.shop.price_bw}/page</p>
                </div>
              </div>
            </div>
            <Button size="sm" variant="lime" asChild className="flex-shrink-0">
              <Link href={`/student/order/new?shop=${topShop.shop.id}`}>
                Order Here <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Location selector */}
        {locations.length > 0 && (
          <select
            value={selectedLocationId ?? ""}
            onChange={(e) => {
              const url = e.target.value ? `/student/shops?location=${e.target.value}` : "/student/shops";
              router.push(url);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-slate-100/60 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}

        {/* Deadline */}
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          placeholder="Your deadline (optional)"
          className="h-10 flex-1 rounded-lg border border-slate-300 bg-slate-100/60 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Open only toggle */}
        <button
          onClick={() => setShowOnlyOpen(!showOnlyOpen)}
          className={`flex items-center gap-2 px-3 h-10 rounded-lg border text-sm font-medium transition-colors ${
            showOnlyOpen
              ? "border-emerald-600 bg-emerald-600/10 text-emerald-400"
              : "border-slate-300 text-slate-500 hover:text-white"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${showOnlyOpen ? "bg-emerald-400" : "bg-zinc-600"}`} />
          Open Now
        </button>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { value: "best", label: "Best Match" },
          { value: "fastest", label: "Fastest" },
          { value: "cheapest", label: "Cheapest" },
          { value: "rated", label: "Highest Rated" },
          { value: "queue", label: "Short Queue" },
        ] as const).map((option) => (
          <button
            key={option.value}
            onClick={() => setSort(option.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sort === option.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-500 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Shop list */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No shops found</p>
          <p className="text-slate-400 text-sm mt-1">Try a different location or remove filters</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map(({ shop, recommendation }, index) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              recommendation={recommendation}
              rank={index + 1}
              isTop={recommendation.is_recommended}
            />          ))}
        </div>
      )}
    </div>
  );
}

function ShopCard({
  shop,
  recommendation,
  isTop,
}: {
  shop: Shop;
  recommendation: ScoredShop["recommendation"];
  rank: number;
  isTop: boolean;
}) {
  return (
    <Card className={`${isTop ? "border-lime-500/30" : ""} ${!shop.is_open ? "opacity-60" : ""} hover:border-blue-600/40 transition-colors`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-slate-900 font-bold text-lg leading-tight">{shop.name}</h3>
              {isTop && <Badge variant="lime" className="text-[10px]">AI Pick</Badge>}
              {!shop.is_open ? (
                <Badge variant="destructive" className="text-[10px]">Closed</Badge>
              ) : (
                <Badge variant="success" className="text-[10px]">Open</Badge>
              )}
            </div>

            <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
              <MapPin className="w-3 h-3" />
              <span>{shop.address}</span>
              {shop.location && (
                <>
                  <span>·</span>
                  <span>{shop.location.name}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-slate-900 text-sm font-medium">{shop.rating.toFixed(1)}</span>
                <span className="text-slate-400 text-xs">({shop.total_reviews})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 text-sm">{shop.current_queue} in queue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 text-sm">~{shop.avg_completion_minutes}min</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-slate-900 font-bold text-base">₹{shop.price_bw}<span className="text-slate-400 text-xs font-normal">/pg B&W</span></p>
              <p className="text-slate-500 text-xs">₹{shop.price_color}/pg Color</p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400">Ready ~</p>
              <p className="text-slate-900 text-xs font-medium">
                {format(new Date(recommendation.predicted_ready_at), "h:mm a")}
              </p>
            </div>

            <Button size="sm" disabled={!shop.is_open} asChild>
              <Link href={`/student/order/new?shop=${shop.id}`}>
                {shop.is_open ? "Order" : "Closed"}
                {shop.is_open && <ArrowRight className="w-3.5 h-3.5" />}
              </Link>
            </Button>
          </div>
        </div>

        {isTop && recommendation.explanation && (
          <div className="mt-3 flex items-start gap-2 bg-lime-500/5 border border-lime-500/15 rounded-lg px-3 py-2">
            <Brain className="w-3.5 h-3.5 text-lime-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-600 text-xs">{recommendation.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



