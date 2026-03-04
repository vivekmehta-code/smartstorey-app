"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Wallet, FilePlus, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TEST_USERS = {
  requester: { email: "requester@test.com", password: "Test123!@#" },
  payee: { email: "payee@test.com", password: "Test123!@#" },
};

const SAMPLE_REQUESTS = [
  { category: "Food", amount: 150, upi_string: "upi://pay?pa=merchant@upi&pn=Test%20Merchant&am=150&cu=INR" },
  { category: "Auto travel", amount: 250, upi_string: "upi://pay?pa=driver@upi&pn=Test%20Driver&am=250&cu=INR" },
  { category: "Hardware purchase", amount: 500, upi_string: "upi://pay?pa=store@upi&pn=Test%20Store&am=500&cu=INR" },
];

export default function TestSetupPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const getSession = async () => {
      const { data: { user: u } } = await client.auth.getUser();
      setUser(u ?? null);
    };

    getSession();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const createUser = async (role: "requester" | "payee") => {
    if (!supabase) {
      showMessage("error", "Supabase not configured.");
      return;
    }

    setLoading(role);
    const { email, password } = TEST_USERS[role];

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        if (error.message.includes("already registered")) {
          showMessage("success", `${role === "payee" ? "Payee" : "Requester"} already exists. Sign in instead.`);
        } else {
          showMessage("error", error.message);
        }
        return;
      }

      if (data.user) {
        showMessage("success", `${role === "payee" ? "Payee" : "Requester"} created. Check Supabase for email confirmation, or disable it in Auth settings.`);
        setUser(data.user);
      }
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  const signIn = async (role: "requester" | "payee") => {
    if (!supabase) return;

    setLoading(`signin-${role}`);
    const { email, password } = TEST_USERS[role];

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        showMessage("error", error.message);
        return;
      }

      showMessage("success", `Signed in as ${role}`);
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    showMessage("success", "Signed out");
  };

  const addBalance = async () => {
    if (!supabase || !user) {
      showMessage("error", "Sign in as Payee first.");
      return;
    }

    setLoading("balance");

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preloaded_balance")
        .eq("id", user.id)
        .single();

      const current = Number(profile?.preloaded_balance ?? 0);
      const newBalance = current + 1000;

      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, preloaded_balance: newBalance, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );

      if (error) throw error;
      showMessage("success", `Added ₹1000. New balance: ₹${newBalance}`);
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed to add balance");
    } finally {
      setLoading(null);
    }
  };

  const createSampleRequests = async () => {
    if (!supabase) return;

    setLoading("requests");

    try {
      for (const req of SAMPLE_REQUESTS) {
        const { error } = await supabase.from("requests").insert({
          category: req.category,
          upi_string: req.upi_string,
          amount: req.amount,
          status: "pending",
          requester_id: user?.id ?? null,
          requester_email: user?.email ?? "requester@test.com",
        });
        if (error) throw error;
      }

      showMessage("success", `Created ${SAMPLE_REQUESTS.length} sample requests`);
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed to create requests");
    } finally {
      setLoading(null);
    }
  };

  const btn = (label: string, onClick: () => void, isLoading: boolean, icon: React.ReactNode) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium transition-opacity disabled:opacity-70"
      style={{ borderColor: "var(--smartstorey-sand)", color: "var(--smartstorey-charcoal)" }}
    >
      {icon}
      {isLoading ? "..." : label}
    </button>
  );

  if (!supabase) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4" style={{ backgroundColor: "var(--smartstorey-cream)" }}>
        <p className="mb-4" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
          Add Supabase credentials to .env.local to use test setup.
        </p>
        <Link href="/" className="text-sm font-medium" style={{ color: "var(--smartstorey-gold)" }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6" style={{ backgroundColor: "var(--smartstorey-cream)" }}>
      <Link
        href="/"
        className="mb-4 flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--smartstorey-charcoal-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <h1 className="mb-2 text-2xl font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
        Test Setup
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
        Create test users and seed data for development
      </p>

      {message && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: message.type === "error" ? "var(--smartstorey-error-bg)" : "var(--smartstorey-gold-light)",
            color: message.type === "error" ? "var(--smartstorey-error-text)" : "var(--smartstorey-charcoal)",
          }}
        >
          {message.text}
        </div>
      )}

      {user && (
        <p className="mb-4 text-sm" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
          Signed in as: <strong style={{ color: "var(--smartstorey-charcoal)" }}>{user.email}</strong>
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--smartstorey-sand)", backgroundColor: "white" }}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            Create test users
          </h2>
          <p className="mb-3 text-xs" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            Password for both: Test123!@#
          </p>
          <div className="flex gap-3">
            {btn("Create Payee", () => createUser("payee"), loading === "payee", <UserPlus className="h-4 w-4" />)}
            {btn("Create Requester", () => createUser("requester"), loading === "requester", <UserPlus className="h-4 w-4" />)}
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: "var(--smartstorey-sand)", backgroundColor: "white" }}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            Sign in
          </h2>
          <div className="flex gap-3">
            {btn("Sign in as Payee", () => signIn("payee"), loading === "signin-payee", <LogIn className="h-4 w-4" />)}
            {btn("Sign in as Requester", () => signIn("requester"), loading === "signin-requester", <LogIn className="h-4 w-4" />)}
          </div>
          {user && (
            <button
              onClick={signOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm"
              style={{ color: "var(--smartstorey-charcoal-muted)" }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: "var(--smartstorey-sand)", backgroundColor: "white" }}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            Seed data
          </h2>
          <div className="flex flex-col gap-2">
            {btn("Add ₹1000 to Payee balance", addBalance, loading === "balance", <Wallet className="h-4 w-4" />)}
            {btn("Create sample requests", createSampleRequests, loading === "requests", <FilePlus className="h-4 w-4" />)}
          </div>
        </div>

        <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: "var(--smartstorey-gold-light)" }}>
          <p className="text-sm" style={{ color: "var(--smartstorey-charcoal)" }}>
            <strong>Testing flow:</strong> 1) Create users → 2) Sign in as Payee → Add balance → 3) Create sample requests → 4) Go to Payee Dashboard to claim, or use Requester to create new requests.
          </p>
        </div>
      </div>
    </div>
  );
}
