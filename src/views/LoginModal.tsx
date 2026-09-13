import React, { useState } from "react";
import { X, Lock, Shield, ChefHat, Monitor, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requiredRole?: "admin" | "kitchen" | "pos";
}

export function LoginModal({ isOpen, onClose, onSuccess, requiredRole }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      setLoading(false);
      if (requiredRole && loggedInUser.role !== "admin" && loggedInUser.role !== requiredRole) {
        setError(`Access denied. Your role is '${loggedInUser.role}', but this route requires '${requiredRole}'.`);
        return;
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to log in");
    }
  };

  const handleDemoChip = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
  };

  return (
    <div id="login-modal-overlay" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        id="login-modal-card"
        className="bg-white w-full max-w-md rounded-2xl border border-[#E8E2DE] shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.svg"
              alt="FRYGUY"
              className="w-10 h-10 object-contain rounded-xl shadow-xs"
            />
            <div>
              <h3 className="font-['Archivo_Black'] text-lg text-[#171717]">Operational Access</h3>
              <p className="text-xs text-[#737373]">
                {requiredRole
                  ? `Authentication required for /${requiredRole}`
                  : "Sign in to access restaurant technology portals"}
              </p>
            </div>
          </div>
          <button
            id="close-login-modal-btn"
            onClick={onClose}
            className="text-[#737373] hover:text-[#171717] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#FFE8E9] border border-[#ED1C24]/30 rounded-xl text-xs text-[#B90F18] flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast Login Chips */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider">
            Quick Demo Accounts (1-Click)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="demo-chip-admin"
              onClick={() => handleDemoChip("admin@fryguy.com")}
              className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all ${
                email === "admin@fryguy.com"
                  ? "border-[#ED1C24] bg-[#FFE8E9]/40 text-[#ED1C24]"
                  : "border-[#E8E2DE] hover:bg-[#FFF9F5] text-[#171717]"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#ED1C24]" />
              <span>Owner / Admin</span>
            </button>

            <button
              type="button"
              id="demo-chip-kitchen-fg"
              onClick={() => handleDemoChip("kitchen-fryguy@fryguy.com")}
              className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all ${
                email === "kitchen-fryguy@fryguy.com"
                  ? "border-[#ED1C24] bg-[#FFE8E9]/40 text-[#ED1C24]"
                  : "border-[#E8E2DE] hover:bg-[#FFF9F5] text-[#171717]"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-[#218739]" />
              <span>FRYGUY Kitchen</span>
            </button>

            <button
              type="button"
              id="demo-chip-kitchen-choc"
              onClick={() => handleDemoChip("kitchen-chocolate@fryguy.com")}
              className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all ${
                email === "kitchen-chocolate@fryguy.com"
                  ? "border-[#ED1C24] bg-[#FFE8E9]/40 text-[#ED1C24]"
                  : "border-[#E8E2DE] hover:bg-[#FFF9F5] text-[#171717]"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-[#4A2E1B]" />
              <span>Choc Ritual Kitchen</span>
            </button>

            <button
              type="button"
              id="demo-chip-pos"
              onClick={() => handleDemoChip("pos@fryguy.com")}
              className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition-all ${
                email === "pos@fryguy.com"
                  ? "border-[#ED1C24] bg-[#FFE8E9]/40 text-[#ED1C24]"
                  : "border-[#E8E2DE] hover:bg-[#FFF9F5] text-[#171717]"
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-[#C98200]" />
              <span>Counter POS</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">
              Email Address
            </label>
            <input
              id="login-email-input"
              type="email"
              placeholder="e.g. admin@fryguy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] focus:bg-white focus:outline-none focus:border-[#ED1C24]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">
              Password
            </label>
            <input
              id="login-password-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E8E2DE] bg-[#FFF9F5] focus:bg-white focus:outline-none focus:border-[#ED1C24]"
            />
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#ED1C24] hover:bg-[#B90F18] disabled:opacity-50 text-white font-['Archivo_Black'] text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer"
          >
            {loading ? "AUTHENTICATING..." : "AUTHENTICATE & ENTER"}
          </button>
        </form>

        <p className="text-[11px] text-[#737373] text-center">
          Customer ordering does not require any account.
        </p>
      </div>
    </div>
  );
}
