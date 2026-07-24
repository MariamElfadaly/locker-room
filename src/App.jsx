import React from "react";
import { useAuth } from "./useAuth";
import Login from "./Login";
import LockerRoom from "./LockerRoom";

export default function App() {
  const { user, authLoading, signOut } = useAuth();

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#EAE5DC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", color: "#6B7478", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <LockerRoom user={user} onSignOut={signOut} />;
}
