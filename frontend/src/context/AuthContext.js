"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    // If we are on localhost but the API is on 127.0.0.1 or vice versa
    return `http://${window.location.hostname}:8000`;
  }
  return "http://127.0.0.1:8000";
};

const API_URL = getBaseURL();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`);
        const data = await res.json();
        if (data.mode === "demo") {
          setBackendStatus("demo");
        } else {
          setBackendStatus("production");
        }
      } catch {
        setBackendStatus("offline");
      }
    };
    checkStatus();

    // Recover session
    const token = localStorage.getItem("clarion_token");
    const email = localStorage.getItem("clarion_email");
    const username = localStorage.getItem("clarion_username");
    if (token && email) {
      setUser({ email, username: username || email.split('@')[0], token });
    }
    setLoading(false);
  }, []);

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev);
  };

  const login = async (email, password) => {
    let res;
    try {
      res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });
    } catch {
      throw new Error("Cannot reach backend. Start FastAPI server and try again.");
    }

    if (!res.ok) {
      let errorData = {};
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text().catch(() => "");
        console.error("Auth error raw response:", text);
        errorData = { detail: text || "Authentication Rejected." };
      }
      throw new Error(errorData.detail || "Authentication Rejected.");
    }

    const data = await res.json();
    localStorage.setItem("clarion_token", data.access_token);
    localStorage.setItem("clarion_email", email);
    // Fetch username from profile
    let username = email.split('@')[0];
    try {
      const profRes = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      if (profRes.ok) {
        const prof = await profRes.json();
        username = prof.username || username;
        localStorage.setItem("clarion_username", username);
      }
    } catch {}
    setUser({ email, username, token: data.access_token });
    router.push("/");
    return true;
  };

  const updateProfile = async (updateData) => {
    if (!user?.token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(updateData),
      });
      
      if (res.ok) {
        const newUser = { ...user, ...updateData };
        setUser(newUser);
        if (updateData.username) localStorage.setItem("clarion_username", updateData.username);
        if (updateData.email) localStorage.setItem("clarion_email", updateData.email);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const register = async (username, email, password, name = "Student") => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, name }),
    });
    if (!res.ok) {
      let errorData = {};
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text().catch(() => "");
        console.error("Signup error raw response:", text);
        errorData = { detail: text || "Registration failed." };
      }
      throw new Error(errorData.detail || "Registration failed.");
    }
    localStorage.setItem("clarion_username", username);
    try {
      await login(email, password);
    } catch (err) {
      console.error("Auto-login after signup failed:", err);
      // Don't throw here, just redirect to login
      router.push("/login");
    }
    return true;
  };

  const logout = () => {
    localStorage.removeItem("clarion_token");
    localStorage.removeItem("clarion_email");
    localStorage.removeItem("clarion_username");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile, loading, isDemoMode, toggleDemoMode, backendStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
