"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { Camera, ImagePlus, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, extractAmountFromUpi } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
  "Porter",
  "Hardware purchase",
  "Auto travel",
  "Food",
  "Others",
] as const;

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export default function RequesterPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [upiString, setUpiString] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [requesterEmail, setRequesterEmail] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [scanMode, setScanMode] = useState<"idle" | "camera" | "upload">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanMode("idle");
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    setUpiString("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanMode("camera");

      const scanFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code?.data) {
          setUpiString(code.data);
          stopCamera();
        }
      };

      scanIntervalRef.current = setInterval(scanFrame, 200);
    } catch (err) {
      setError("Camera access denied. Try uploading from gallery instead.");
      setScanMode("idle");
    }
  }, [stopCamera]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      setUpiString("");
      const file = e.target.files?.[0];
      if (!file) return;

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code?.data) {
          setUpiString(code.data);
          setScanMode("upload");
        } else {
          setError("No QR code found in image. Please try another image.");
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
      e.target.value = "";
    },
    []
  );

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (user?.email) setRequesterEmail(user.email);
    });
  }, [supabase]);

  // Pre-fill amount from QR when it contains one
  useEffect(() => {
    if (upiString) {
      const qrAmount = extractAmountFromUpi(upiString);
      if (qrAmount != null) setAmount(String(qrAmount));
    }
  }, [upiString]);

  const handleSubmit = async () => {
    if (!upiString.trim()) {
      setError("Please scan or upload a QR code first.");
      return;
    }
    const amountNum = parseFloat(amount.trim());
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!category) {
      setError("Please select a category.");
      return;
    }
    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email ?? (requesterEmail.trim() || null);

      const { error: insertError } = await supabase.from("requests").insert({
        requester_id: user?.id ?? null,
        requester_email: email,
        category,
        upi_string: upiString,
        amount: amountNum,
        status: "pending",
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUpiString("");
    setAmount("");
    setCategory("");
    setRequesterEmail("");
    setSubmitted(false);
    setError("");
    setScanMode("idle");
  };

  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: "var(--smartstorey-cream)" }}>
        <div className="flex max-w-sm flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--smartstorey-gold-light)" }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--smartstorey-gold)" }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
              Waiting for Payee
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
              Your request has been sent. The payee will process it shortly.
            </p>
          </div>
          <button
            onClick={resetForm}
            className="w-full rounded-lg border bg-white px-4 py-3 text-sm font-medium"
            style={{ borderColor: "var(--smartstorey-sand)", color: "var(--smartstorey-charcoal)" }}
          >
            Submit Another Request
          </button>
        </div>
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
      <header className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
          New Request
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
          Scan a UPI QR code or upload from gallery
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-6">
        {/* Scan / Upload buttons */}
        <div className="flex gap-3">
          <button
            onClick={startCamera}
            disabled={scanMode === "camera"}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 transition-colors",
              scanMode === "camera" && "ring-2"
            )}
            style={
              scanMode === "camera"
                ? { borderColor: "var(--smartstorey-gold)", backgroundColor: "var(--smartstorey-gold-light)" }
                : { borderColor: "var(--smartstorey-sand)", backgroundColor: "white" }
            }
          >
            <Camera className="h-6 w-6" style={{ color: "var(--smartstorey-charcoal)" }} />
            <span className="font-medium" style={{ color: "var(--smartstorey-charcoal)" }}>
              Scan QR
            </span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 transition-colors",
              scanMode === "upload" && upiString && "ring-2"
            )}
            style={
              scanMode === "upload" && upiString
                ? { borderColor: "var(--smartstorey-gold)", backgroundColor: "var(--smartstorey-gold-light)" }
                : { borderColor: "var(--smartstorey-sand)", backgroundColor: "white" }
            }
          >
            <ImagePlus className="h-6 w-6" style={{ color: "var(--smartstorey-charcoal)" }} />
            <span className="font-medium" style={{ color: "var(--smartstorey-charcoal)" }}>
              Upload from Gallery
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Camera preview */}
        {scanMode === "camera" && (
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              className="aspect-[4/3] w-full object-cover"
              playsInline
              muted
            />
            <button
              onClick={stopCamera}
              className="absolute right-3 top-3 rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white"
            >
              Cancel
            </button>
            <div className="absolute inset-0 border-4 border-white/30" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Scan preview */}
        {upiString && (
          <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--smartstorey-sand)" }}>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--smartstorey-charcoal-muted)" }}>
              Scanned UPI
            </p>
            <p className="break-all font-mono text-sm" style={{ color: "var(--smartstorey-charcoal)" }}>
              {upiString}
            </p>
          </div>
        )}

        {/* Amount - required */}
        {upiString && (
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: "var(--smartstorey-charcoal)" }}>
              Amount (₹) <span style={{ color: "var(--smartstorey-gold)" }}>*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--smartstorey-gold)] focus:ring-offset-0"
              style={{ borderColor: "var(--smartstorey-sand)", color: "var(--smartstorey-charcoal)" }}
            />
          </div>
        )}

        {/* Requester email - only when not signed in */}
        {isLoggedIn === false && (
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: "var(--smartstorey-charcoal)" }}>
              Your email <span className="text-xs" style={{ color: "var(--smartstorey-charcoal-muted)" }}>(optional, so payee knows who requested)</span>
            </label>
            <input
              type="email"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--smartstorey-gold)] focus:ring-offset-0"
              style={{ borderColor: "var(--smartstorey-sand)", color: "var(--smartstorey-charcoal)" }}
            />
          </div>
        )}

        {/* Category dropdown */}
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--smartstorey-charcoal)" }}>
            Category <span style={{ color: "var(--smartstorey-gold)" }}>*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--smartstorey-gold)] focus:ring-offset-0"
            style={{ borderColor: "var(--smartstorey-sand)", color: "var(--smartstorey-charcoal)" }}
          >
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "var(--smartstorey-error-bg)", color: "var(--smartstorey-error-text)" }}>
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
          style={{ backgroundColor: "var(--smartstorey-charcoal)" }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Request"
          )}
        </button>
      </div>
    </div>
  );
}
