import React, { useState } from "react";
import { useAuth } from "./useAuth";

// Sign-in only -- no self-service sign-up. Since everyone who logs in shares
// the same locker room data, accounts are created by you (the admin) in the
// Firebase Console, not by random visitors. See README "Adding a team member".
export default function Login() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email) {
      setError("Enter your email above first, then click 'Forgot password'.");
      return;
    }
    setError("");
    try {
      await resetPassword(email);
      setNotice("Password reset email sent.");
    } catch (err) {
      setError(friendlyError(err.code));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.title}>LOCKER ROOM</div>
        <div style={styles.subtitle}>Sign in to continue</div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          {error && <div style={styles.error}>{error}</div>}
          {notice && <div style={styles.notice}>{notice}</div>}

          <button type="submit" disabled={busy} style={styles.submitBtn}>
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>

        <div style={styles.footerRow}>
          <button style={styles.linkBtn} onClick={handleReset}>Forgot password?</button>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#EAE5DC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    padding: 16,
  },
  card: {
    width: 360,
    maxWidth: "100%",
    background: "#F5F1EA",
    border: "1px solid #DCD5C7",
    borderRadius: 10,
    padding: 28,
    boxShadow: "0 20px 50px rgba(30,36,39,0.15)",
  },
  title: { fontFamily: "'Oswald', sans-serif", fontSize: 24, fontWeight: 700, color: "#2B3A42", letterSpacing: "0.02em" },
  subtitle: { fontSize: 13, color: "#6B7478", marginTop: 4 },
  input: { padding: "10px 12px", borderRadius: 6, border: "1px solid #C7BFB0", fontSize: 14, outline: "none" },
  submitBtn: { background: "#2B3A42", color: "#F5F1EA", border: "none", borderRadius: 6, padding: "10px 0", fontSize: 14, cursor: "pointer" },
  error: { fontSize: 12.5, color: "#B0463A", background: "#FBEAE6", border: "1px solid #EFCFC6", borderRadius: 6, padding: "7px 9px" },
  notice: { fontSize: 12.5, color: "#2B6B4F", background: "#E7F3EC", border: "1px solid #C9E3D4", borderRadius: 6, padding: "7px 9px" },
  footerRow: { display: "flex", justifyContent: "flex-start", marginTop: 14 },
  linkBtn: { background: "none", border: "none", color: "#6B7478", fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 },
};
