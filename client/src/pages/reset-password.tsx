import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type View = "loading" | "email" | "password" | "done";
type MsgType = "error" | "success" | "info" | null;

export default function ResetPassword() {
  const [view, setView] = useState<View>("loading");
  const [msg, setMsg] = useState<{ text: string; type: MsgType }>({ text: "", type: null });
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subtitle, setSubtitle] = useState("Reset your password");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sb = supabase;

  const clearErrors = useCallback(() => setErrors({}), []);
  const clearMsg = useCallback(() => setMsg({ text: "", type: null }), []);

  useEffect(() => {
    if (!sb) {
      setView("email");
      setMsg({ text: "Unable to connect. Please try again later.", type: "error" });
      return;
    }

    let ready = false;

    // If auth-callback already exchanged the code and flagged recovery mode,
    // skip all token detection and go straight to the password form.
    const recoveryFlag = sessionStorage.getItem("passwordRecovery");
    if (recoveryFlag) {
      sessionStorage.removeItem("passwordRecovery");
      ready = true;
      setSubtitle("Set your new password");
      setView("password");
      return;
    }

    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !ready) {
        ready = true;
        setSubtitle("Set your new password");
        setView("password");
        window.history.replaceState({}, "", "/reset-password");
      }
    });

    const hash = window.location.hash.substring(1);
    const queryParams = new URLSearchParams(window.location.search);
    const hasCode = queryParams.get("code");
    const hashParams = new URLSearchParams(hash);
    const hasTokens = hash && (hashParams.get("access_token") || hashParams.get("error") || hashParams.get("type"));
    const hasError = hashParams.get("error") || queryParams.get("error");

    if (hasError) {
      ready = true;
      setView("email");
      setMsg({ text: "Your reset link has expired. Enter your email below to get a new reset code.", type: "info" });
    } else if (hasCode) {
      sb.auth.exchangeCodeForSession(hasCode).then(({ error }) => {
        if (error && !ready) {
          ready = true;
          setView("email");
          setMsg({ text: "This reset link has expired. Enter your email below to get a new reset code.", type: "info" });
        } else if (!error && !ready) {
          ready = true;
          setSubtitle("Set your new password");
          setView("password");
          window.history.replaceState({}, "", "/reset-password");
        }
      });
    } else if (hasTokens) {
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      if (access_token && refresh_token) {
        sb.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (error && !ready) {
            ready = true;
            setView("email");
            setMsg({ text: "This reset link has expired. Enter your email below to get a new reset code.", type: "info" });
          } else if (!error && !ready) {
            ready = true;
            setSubtitle("Set your new password");
            setView("password");
            window.history.replaceState({}, "", "/reset-password");
          }
        });
      }
    } else {
      sb.auth.getSession().then(({ data }) => {
        if (!ready) {
          if (data?.session) {
            sb.auth.getUser().then(() => {
              if (!ready) {
                ready = true;
                setView("email");
              }
            });
          } else {
            ready = true;
            setView("email");
          }
        }
      });
    }

    const timeout = setTimeout(() => {
      if (!ready) {
        ready = true;
        setView("email");
        setMsg({ text: "This reset link has expired. Enter your email below to get a new reset code.", type: "info" });
      }
    }, 6000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [sb]);

  const handleSendCode = async (emailAddr: string) => {
    if (!sb) return;
    clearMsg();
    clearErrors();
    if (!emailAddr.trim()) {
      setErrors({ email: "Please enter your email" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await sb.auth.resetPasswordForEmail(emailAddr.trim(), {
        redirectTo: "https://ezrasnashim.app/reset-password",
      });
      if (error) throw error;
      setMsg({ text: "We've sent a password reset link to " + emailAddr.trim() + ". Please check your email and click the link to reset your password.", type: "success" });
    } catch (e: any) {
      setMsg({ text: e.message || "Failed to send reset code. Please try again.", type: "error" });
    }
    setSubmitting(false);
  };

  const handleUpdatePassword = async () => {
    if (!sb) return;
    clearMsg();
    clearErrors();
    const newErrors: Record<string, string> = {};
    if (pw.length < 6) newErrors.pw = "Password must be at least 6 characters";
    if (pw !== cpw) newErrors.cpw = "Passwords do not match";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      setView("done");
      setMsg({ text: "Your password has been updated! You can now sign in with your new password.", type: "success" });
    } catch (e: any) {
      setMsg({ text: e.message || "Failed to update password. Please try again.", type: "error" });
    }
    setSubmitting(false);
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: "#faf8f9",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "400px",
    background: "#fff",
    borderRadius: "20px",
    padding: "32px 24px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e0d8dc",
    borderRadius: "12px",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#fff",
    cursor: submitting ? "not-allowed" : "pointer",
    background: "linear-gradient(135deg, #EAC8CD 0%, #D5CDE4 50%, #B3CCB3 100%)",
    opacity: submitting ? 0.5 : 1,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#333",
    marginBottom: "6px",
  };

  const errorStyle: React.CSSProperties = {
    color: "#e53e3e",
    fontSize: "13px",
    marginTop: "6px",
  };

  const msgStyle = (type: MsgType): React.CSSProperties => ({
    textAlign: "center" as const,
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "16px",
    fontSize: "14px",
    display: type ? "block" : "none",
    background: type === "error" ? "#fee" : type === "success" ? "#f0fff4" : "#ebf8ff",
    color: type === "error" ? "#c53030" : type === "success" ? "#276749" : "#2b6cb0",
  });

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ textAlign: "center", fontSize: "24px", color: "#000", marginBottom: "6px" }}>Ezras Nashim</h1>
        <p style={{ textAlign: "center", color: "#666", fontSize: "14px", marginBottom: "28px" }}>{subtitle}</p>

        {msg.type && <div style={msgStyle(msg.type)}>{msg.text}</div>}

        {view === "loading" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div
              style={{
                display: "inline-block",
                width: "36px",
                height: "36px",
                border: "3px solid #e0d8dc",
                borderTopColor: "#D5CDE4",
                borderRadius: "50%",
                animation: "resetSpinner .8s linear infinite",
              }}
            />
            <p style={{ color: "#666", fontSize: "13px", marginTop: "12px" }}>Verifying your reset link...</p>
            <style>{`@keyframes resetSpinner{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {view === "email" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCode(email);
            }}
          >
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                style={inputStyle}
              />
              {errors.email && <div style={errorStyle}>{errors.email}</div>}
            </div>
            <button type="submit" disabled={submitting} style={btnStyle}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {view === "password" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdatePassword();
            }}
          >
            <div style={{ marginBottom: "18px", position: "relative" }}>
              <label style={labelStyle}>New Password</label>
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                style={{ ...inputStyle, paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: "12px", top: "34px", background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "13px" }}
              >
                {showPw ? "Hide" : "Show"}
              </button>
              {errors.pw && <div style={errorStyle}>{errors.pw}</div>}
            </div>
            <div style={{ marginBottom: "18px", position: "relative" }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type={showCpw ? "text" : "password"}
                value={cpw}
                onChange={(e) => setCpw(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                style={{ ...inputStyle, paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowCpw(!showCpw)}
                style={{ position: "absolute", right: "12px", top: "34px", background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "13px" }}
              >
                {showCpw ? "Hide" : "Show"}
              </button>
              {errors.cpw && <div style={errorStyle}>{errors.cpw}</div>}
            </div>
            <button type="submit" disabled={submitting} style={btnStyle}>
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <a
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: "18px",
            color: "#D5CDE4",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {view === "done" ? "Go to App" : "Back to App"}
        </a>
      </div>
    </div>
  );
}
