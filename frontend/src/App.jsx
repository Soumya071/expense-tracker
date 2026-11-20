import { useState } from "react";
import { getToken } from "./api";
import AuthForm from "./components/AuthForm.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");

  function handleLogin({ token, user }) {
    localStorage.setItem("token", token);
    localStorage.setItem("userName", user.name);
    setUserName(user.name);
    setLoggedIn(true);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setLoggedIn(false);
  }

  return loggedIn ? (
    <Dashboard userName={userName} onLogout={handleLogout} />
  ) : (
    <AuthForm onLogin={handleLogin} />
  );
}
