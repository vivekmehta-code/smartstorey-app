"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PENDING_CLAIM_KEY = "smartstorey_pending_claim";

type Request = {
  id: string;
  category: string;
  upi_string: string;
  amount: number | null;
  status: string;
  created_at: string;
  requester_email: string | null;
};

export default function PayeePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingClaim, setPendingClaim] = useState<Request | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(PENDING_CLAIM_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Request;
        setPendingClaim(parsed);
      } catch {
        sessionStorage.removeItem(PENDING_CLAIM_KEY);
      }
    }
  }, []);

  // Safety Valve: Reset claims stuck for >10 minutes when pay page loads
  useEffect(() => {
    if (!supabase) return;

    const resetStaleClaims = async () => {
      if (!supabase) return;
      try {
        await supabase.rpc("reset_stale_claims");
      } catch {
        // Silently ignore - RPC may not exist yet if migration not run
      }
    };

    resetStaleClaims();
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("preloaded_balance")
            .eq("id", user.id)
            .single();
          setBalance(profile?.preloaded_balance ?? 0);
        }

        if (!pendingClaim) {
          const { data, error: fetchError } = await supabase
            .from("requests")
            .select("id, category, upi_string, amount, status, created_at, requester_email")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          if (fetchError) throw fetchError;
          setRequests(data ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pendingClaim]);

  const handleClaim = async (request: Request) => {
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from("requests")
        .update({ status: "claimed", claimant_id: user?.id ?? null, claimed_at: new Date().toISOString() })
        .eq("id", request.id)
        .eq("status", "pending");

      if (updateError) throw updateError;

      sessionStorage.setItem(PENDING_CLAIM_KEY, JSON.stringify(request));
      setPendingClaim(request);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));

      window.location.href = request.upi_string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim request.");
    }
  };

  const handleConfirmPayment = async () => {
    if (!supabase || !pendingClaim) return;

    setConfirming(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const amount = Number(pendingClaim.amount) || 0;

      const { data: profile } = await supabase
        .from("profiles")
        .select("preloaded_balance")
        .eq("id", user.id)
        .single();

      const currentBalance = Number(profile?.preloaded_balance ?? 0);
      if (currentBalance < amount) {
        throw new Error("Insufficient balance.");
      }

      const newBalance = currentBalance - amount;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, preloaded_balance: newBalance, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      const { error: requestError } = await supabase
        .from("requests")
        .update({ status: "paid" })
        .eq("id", pendingClaim.id);

      if (requestError) throw requestError;

      sessionStorage.removeItem(PENDING_CLAIM_KEY);
      setPendingClaim(null);
      setBalance(newBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm payment.");
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!supabase || !pendingClaim) return;

    try {
      const { error: updateError } = await supabase
        .from("requests")
        .update({ status: "pending", claimant_id: null })
        .eq("id", pendingClaim.id);

      if (updateError) throw updateError;

      sessionStorage.removeItem(PENDING_CLAIM_KEY);
      setPendingClaim(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  if (pendingClaim) {
    return (
      <div
        className="flex min-h-dvh flex-col px-4 py-6"
        style={{ backgroundColor: "var(--smartstorey-cream)" }}
      >
        <header className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
            Confirm Payment
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            Did you complete the payment in your UPI app?
          </p>
        </header>

        <div
          className="mb-6 rounded-xl border p-4"
          style={{ borderColor: "var(--smartstorey-sand)", backgroundColor: "white" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            {pendingClaim.category}
          </p>
          <p className="mt-1 text-xl font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
            ₹{pendingClaim.amount ?? "—"}
          </p>
          {pendingClaim.requester_email && (
            <p className="mt-2 text-sm" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
              Requested by: {pendingClaim.requester_email}
            </p>
          )}
          <p className="mt-1 text-sm" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            {formatDate(pendingClaim.created_at)}
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--smartstorey-error-bg)", color: "var(--smartstorey-error-text)" }}>{error}</p>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={handleConfirmPayment}
            disabled={confirming}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
            style={{ backgroundColor: "var(--smartstorey-charcoal)" }}
          >
            <Check className="h-5 w-5" />
            {confirming ? "Confirming..." : "Confirm Payment"}
          </button>
          <button
            onClick={handleCancel}
            disabled={confirming}
            className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-4 font-medium transition-opacity hover:opacity-90 disabled:opacity-70"
            style={{ borderColor: "var(--smartstorey-sand)", color: "var(--smartstorey-charcoal)" }}
          >
            <X className="h-5 w-5" />
            Back / Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col px-4 py-6"
      style={{ backgroundColor: "var(--smartstorey-cream)" }}
    >
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
            Payee Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            Claim and pay pending requests
          </p>
        </div>
        {balance !== null && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: "var(--smartstorey-gold-light)" }}
          >
            <Wallet className="h-5 w-5" style={{ color: "var(--smartstorey-gold)" }} />
            <span className="font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
              ₹{balance.toFixed(2)}
            </span>
          </div>
        )}
      </header>

      <Link
        href="/"
        className="mb-4 flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--smartstorey-charcoal-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {error && (
        <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--smartstorey-error-bg)", color: "var(--smartstorey-error-text)" }}>{error}</p>
      )}

      {loading ? (
        <p className="py-8 text-center" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
          Loading...
        </p>
      ) : requests.length === 0 ? (
        <div
          className="flex flex-1 flex-col items-center justify-center rounded-xl border py-12"
          style={{ borderColor: "var(--smartstorey-sand)" }}
        >
          <p className="text-center" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
            No pending requests
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--smartstorey-sand)", backgroundColor: "white" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
                    {request.category}
                  </p>
                  <p className="mt-1 text-lg font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
                    ₹{request.amount ?? "—"}
                  </p>
                  {request.requester_email && (
                    <p className="mt-1 text-xs" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
                      Requested by: {request.requester_email}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
                    {formatDate(request.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleClaim(request)}
                  className="shrink-0 rounded-xl px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--smartstorey-charcoal)" }}
                >
                  Claim
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
