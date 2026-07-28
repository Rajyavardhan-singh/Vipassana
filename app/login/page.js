"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div className="min-h-screen font-body bg-ink text-ivory flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm">
        <p className="text-xs tracking-widest uppercase text-muted text-center">Vipassana Practice</p>
        <h1 className="font-display text-3xl text-center mt-1 mb-8">Your Path</h1>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-ivory border border-line placeholder:text-muted"
        />
        {error && <p className="text-sm text-saffron mt-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-ink font-medium py-3 rounded-xl mt-4 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
