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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">
              PrintQueue <span className="text-blue-600">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join the smart printing platform</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form action={formAction} className="space-y-5">
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
                {state.error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input id="full_name" name="full_name" type="text"
                  placeholder="Your full name" className="pl-10"
                  required minLength={2} autoComplete="name" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input id="email" name="email" type="email"
                  placeholder="you@university.edu" className="pl-10"
                  required autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input id="password" name="password" type="password"
                  placeholder="Min 6 characters" className="pl-10"
                  required autoComplete="new-password" minLength={6} />
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input type="radio" name="role" value="student" defaultChecked className="sr-only peer" />
                  <div className="border-2 border-slate-200 rounded-xl p-3 text-center text-sm font-medium text-slate-500
                    peer-checked:border-blue-600 peer-checked:text-blue-600 peer-checked:bg-blue-50 transition-all">
                    🎓 Student
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="role" value="owner" className="sr-only peer" />
                  <div className="border-2 border-slate-200 rounded-xl p-3 text-center text-sm font-medium text-slate-500
                    peer-checked:border-amber-500 peer-checked:text-amber-600 peer-checked:bg-amber-50 transition-all">
                    🏪 Shop Owner
                  </div>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? "Creating account…" : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
        </p>
        <p className="text-center text-slate-400 text-xs mt-3">
          <Link href="/" className="hover:text-slate-600">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

