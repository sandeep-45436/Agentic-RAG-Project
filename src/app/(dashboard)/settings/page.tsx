"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/insforge/client";

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground mt-1">Your account details.</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{user?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">
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
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-medium">Billing</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription and payment methods.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
              Free Plan
            </span>
            <a href="/pricing" className="text-sm font-medium text-blue-600 hover:underline">
              Upgrade Plan
            </a>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/20 p-6">
          <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mt-1">Irreversible account actions.</p>
          <div className="mt-4">
            <button
              className="text-sm font-medium text-destructive hover:underline"
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
  );
}
