"use client";

import { useState } from "react";
import { loginAction, signupAction } from "../actions/authActions";
import { KeyRound, Mail, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const action = isLogin ? loginAction : signupAction;

    try {
      const res = await action(null, formData);
      if (res && res.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected connection error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-fade-in">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "50%", background: "var(--primary-glow)", color: "var(--primary)", marginBottom: "1rem" }}>
            <Sparkles size={32} />
          </div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Timesheetz</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Track your work, hours, and rates securely</p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`tab-btn ${isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-btn ${!isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "1.00rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="input-field"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <KeyRound size={18} style={{ position: "absolute", left: "1.00rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="input-field"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--border-radius-sm)", color: "#fca5a5", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: "1rem" }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                <span>Please wait...</span>
              </div>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
