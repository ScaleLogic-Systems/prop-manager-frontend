// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setErrorMsg(authError.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (authData?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, must_change_password")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
        }

        if (authData.user.user_metadata?.must_change_password === true || profile?.must_change_password === true) {
          router.push("/auth/change-password");
          return;
        }

        const rawRole = profile?.role || "property_manager";
        const normalizedRole = rawRole.toLowerCase().trim().replace(/[\s-]+/g, "_");

        switch (normalizedRole) {
          case "super_admin":
          case "superadmin":
            router.push("/super-admin");
            break;

          case "developer":
            router.push("/developer");
            break;

          case "accountant":
            router.push("/accountant");
            break;

          case "property_manager":
            router.push("/property-manager");
            break;

          case "owner":
          case "property_owner":
            router.push("/owner");
            break;

          case "caretaker":
            router.push("/caretaker");
            break;

          case "agent":
            router.push("/agent"); // <-- Successfully routes agents to their portal!
            break;

          case "marketer":
          case "sales":
            router.push("/marketer");
            break;

          case "tenant":
            router.push("/tenant");
            break;

          default:
            router.push("/tenant");
            break;
        }
      }
    } catch (err: unknown) {
      console.error("Sign-in exception:", err);
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred during sign in.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">PropManager HQ</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your property portal
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            />
            <div className="flex justify-end mt-1.5">
              <Link href="/auth/forgot-password" className="text-xs text-indigo-400 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}