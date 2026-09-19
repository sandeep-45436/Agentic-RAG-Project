"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/insforge/client";
import { AnimatedBackground } from "@/components/animated-background";

interface UserInfo {
  email: string;
  name: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const insforge = createClient();
    insforge.auth.getCurrentUser().then((res: any) => {
      const u = res?.data?.user;
      if (u) {
        setUser({
          email: u.email ?? "—",
          name: u.profile?.name ?? u.email?.split("@")[0] ?? "—",
          createdAt: u.createdAt,
        });
      }
      setLoading(false);
    });
  }, []);

  return (
    <AnimatedBackground>
      <div className="space-y-6 max-w-4xl">
        <div className="light-glass-card anim-fade-up-1 p-6 rounded-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your account settings and preferences.</p>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <div className="rounded-xl border border-slate-200 p-6 light-glass-card card-3d-inner anim-fade-up-2">
            <h3 className="text-lg font-medium text-slate-900">Profile</h3>
            <p className="text-sm text-slate-500 mt-1">Your account details.</p>
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Name</span>
                    <span className="text-sm font-medium text-slate-800">{user?.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Email</span>
                    <span className="text-sm font-medium text-slate-800">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-500">Member Since</span>
                    <span className="text-sm font-medium text-slate-800">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Billing */}
          <div className="rounded-xl border border-slate-200 p-6 light-glass-card card-3d-inner anim-fade-up-3">
            <h3 className="text-lg font-medium text-slate-900">Billing</h3>
            <p className="text-sm text-slate-500 mt-1">
              Manage your subscription and payment methods.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                Free Plan
              </span>
              <a href="/pricing" className="text-sm font-medium text-indigo-600 hover:underline">
                Upgrade Plan
              </a>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-rose-200 p-6 light-glass-card card-3d-inner anim-fade-up-4">
            <h3 className="text-lg font-medium text-rose-600">Danger Zone</h3>
            <p className="text-sm text-slate-500 mt-1">Irreversible account actions.</p>
            <div className="mt-4">
              <button
                className="text-sm font-medium text-rose-600 hover:underline"
                onClick={() => {
                  if (window.confirm("Delete your account? This cannot be undone.")) {
                    alert("Account deletion is not yet available. Please contact support.");
                  }
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
