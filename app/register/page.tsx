"use client";

import Link from "next/link";
import { Printer, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/actions/auth";

const initialState = { error: "" };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await register(formData);
      return result ?? initialState;
    },
    initialState
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">
              PrintQueue <span className="text-lime-400">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Create your account</h1>
          <p className="text-zinc-400 text-sm mt-1">Join the smart printing platform</p>
        </div>

        {/* Form */}
        <div className="glass-card p-8">
          <form action={formAction} className="space-y-5">
            {state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {state.error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Your full name"
                  className="pl-10"
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@university.edu"
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 6 characters"
                  className="pl-10"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="border border-zinc-700 rounded-lg p-3 text-center text-sm font-medium text-zinc-400 peer-checked:border-blue-600 peer-checked:text-blue-400 peer-checked:bg-blue-600/10 transition-colors">
                    🎓 Student
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="owner"
                    className="sr-only peer"
                  />
                  <div className="border border-zinc-700 rounded-lg p-3 text-center text-sm font-medium text-zinc-400 peer-checked:border-amber-500 peer-checked:text-amber-400 peer-checked:bg-amber-500/10 transition-colors">
                    🏪 Shop Owner
                  </div>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? "Creating account..." : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>
        </div>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
          </Link>
        </p>

        <p className="text-center text-zinc-600 text-xs mt-4">
          <Link href="/" className="hover:text-zinc-400">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
