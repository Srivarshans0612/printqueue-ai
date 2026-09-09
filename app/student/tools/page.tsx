"use client";

import { useState } from "react";
import {
  Calculator,
  Brain,
  Leaf,
  BookOpen,
  GraduationCap,
  Pen,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/payments";

const PRESETS = [
  {
    id: "notes", icon: BookOpen, label: "📚 Notes",
    settings: { pages: 50, copies: 1, printType: "bw", priority: "normal" },
    desc: "Lecture notes, handouts",
  },
  {
    id: "assignment", icon: Pen, label: "📝 Assignment",
    settings: { pages: 10, copies: 1, printType: "bw", priority: "normal" },
    desc: "Assignments, reports",
  },
  {
    id: "exam", icon: GraduationCap, label: "🎓 Exam",
    settings: { pages: 80, copies: 2, printType: "bw", priority: "express" },
    desc: "Exam prep, question banks",
  },
];

export default function ToolsPage() {
  const [pages, setPages] = useState(20);
  const [copies, setCopies] = useState(1);
  const [printType, setPrintType] = useState<"bw" | "color">("bw");
  const [priority, setPriority] = useState<"normal" | "express">("normal");
  const [priceBw, setPriceBw] = useState(1.5);
  const [priceColor, setPriceColor] = useState(5);
  const [priorityMult] = useState(1.5);

  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const pricePerPage = printType === "color" ? priceColor : priceBw;
  const base = pages * copies * pricePerPage;
  const total = priority === "express" ? Math.round(base * priorityMult) : Math.round(base);
  const ecoScore = pages * copies <= 10 ? 95 : pages * copies <= 25 ? 85 : pages * copies <= 50 ? 70 : pages * copies <= 100 ? 55 : 40;

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPages(preset.settings.pages);
    setCopies(preset.settings.copies);
    setPrintType(preset.settings.printType as "bw" | "color");
    setPriority(preset.settings.priority as "normal" | "express");
  };

  const handleAiQuery = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiInput }),
      });
      const data = await response.json();
      setAiResponse(data.response ?? "I couldn't process that. Please try again.");
    } catch {
      setAiResponse("AI assistant is temporarily unavailable. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Student Tools</h1>
        <p className="text-zinc-400 text-sm mt-1">Useful utilities to plan your printing</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cost Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="w-4 h-4 text-blue-400" />
              Print Cost Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div>
              <Label className="mb-2 block text-xs">Quick Presets</Label>
              <div className="flex gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="flex-1 text-center py-2 px-1 rounded-lg border border-zinc-700 hover:border-blue-600 hover:bg-blue-600/10 text-zinc-400 hover:text-blue-400 transition-all text-xs"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Pages</Label>
                <Input
                  type="number"
                  min={1}
                  value={pages}
                  onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Copies</Label>
                <Input
                  type="number"
                  min={1}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">B&W Price/page (₹)</Label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={priceBw}
                  onChange={(e) => setPriceBw(parseFloat(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Color Price/page (₹)</Label>
                <Input
                  type="number"
                  min={1}
                  step={0.5}
                  value={priceColor}
                  onChange={(e) => setPriceColor(parseFloat(e.target.value) || 5)}
                />
              </div>
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPrintType(printType === "bw" ? "color" : "bw")}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  printType === "bw"
                    ? "border-zinc-600 bg-zinc-800 text-white"
                    : "border-blue-600 bg-blue-600/10 text-blue-400"
                }`}
              >
                {printType === "bw" ? "⬛ Black & White" : "🎨 Color"}
              </button>
              <button
                onClick={() => setPriority(priority === "normal" ? "express" : "normal")}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  priority === "normal"
                    ? "border-zinc-600 bg-zinc-800 text-white"
                    : "border-amber-500 bg-amber-500/10 text-amber-400"
                }`}
              >
                {priority === "normal" ? "⏱ Normal" : "⚡ Express"}
              </button>
            </div>

            {/* Result */}
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between text-zinc-400">
                  <span>{pages} pages × {copies} copies × ₹{pricePerPage}</span>
                  <span className="text-slate-900">₹{Math.round(base)}</span>
                </div>
                {priority === "express" && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Express ({priorityMult}×)</span>
                    <span className="text-amber-400">+₹{total - Math.round(base)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-zinc-700 pt-3">
                <span className="text-zinc-400 text-sm">Total</span>
                <span className="text-slate-900 font-bold text-2xl">₹{total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eco Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Leaf className="w-4 h-4 text-emerald-400" />
              Eco Score Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-400 text-sm">
              Based on your current calculator settings:
            </p>

            <div className="text-center py-6">
              <div className="relative w-28 h-28 mx-auto mb-4">
                <svg className="transform -rotate-90 w-28 h-28">
                  <circle cx="56" cy="56" r="50" stroke="#27272a" strokeWidth="8" fill="none" />
                  <circle
                    cx="56" cy="56" r="50"
                    stroke={ecoScore >= 80 ? "#22c55e" : ecoScore >= 60 ? "#eab308" : "#ef4444"}
                    strokeWidth="8" fill="none"
                    strokeDasharray={`${(ecoScore / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <p className="text-3xl font-bold text-white">{ecoScore}</p>
                    <p className="text-zinc-500 text-xs text-center">/100</p>
                  </div>
                </div>
              </div>

              <Badge variant={ecoScore >= 80 ? "success" : ecoScore >= 60 ? "warning" : "destructive"} className="mb-3">
                {ecoScore >= 80 ? "Eco-Friendly" : ecoScore >= 60 ? "Moderate" : "High Impact"}
              </Badge>

              <div className="space-y-2 text-sm text-zinc-400">
                <p>Total pages: <strong className="text-slate-900">{pages * copies}</strong></p>
                <p>Fewer pages → higher eco score</p>
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-400">
              🌱 Digital ordering through PrintQueue AI helps reduce unnecessary visits, saving fuel and time. This eco score is an informative product metric.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-lime-400" />
            AI Printing Assistant
            <Badge variant="lime" className="text-[10px]">Beta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Ask me anything about printing — costs, deadlines, document types, or recommendations.
          </p>

          <div className="space-y-3">
            {["I need 50 pages printed before 2 PM, what should I do?",
              "What's the difference between normal and express printing?",
              "How is the eco score calculated?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => setAiInput(q)}
                className="w-full text-left px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-slate-900 text-xs transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ask about printing..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
            />
            <Button
              onClick={handleAiQuery}
              disabled={aiLoading || !aiInput.trim()}
              size="icon"
            >
              {aiLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {aiResponse && (
            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-200 text-sm leading-relaxed">{aiResponse}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

