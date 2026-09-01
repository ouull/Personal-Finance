"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-[#EAE5D9] rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Wallet className="w-8 h-8 text-slate-700" />
          </motion.div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Enter your details to access your account
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm text-center font-medium border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 px-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full rounded-2xl border-0 py-3.5 pl-11 pr-4 bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-slate-900 transition-all sm:text-sm font-medium"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 px-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full rounded-2xl border-0 py-3.5 pl-11 pr-4 bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-slate-900 transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center items-center gap-2 rounded-2xl bg-slate-900 py-3.5 px-4 text-sm font-bold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="font-bold text-slate-900 hover:underline"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
