"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/command-menu";
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/insforge/client";
import { signOutAction } from "@/server/actions/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("U");

  useEffect(() => {
    const insforge = createClient();
    insforge.auth.getCurrentUser().then((res: any) => {
      const user = res?.data?.user;
      if (user?.email) {
        setUserEmail(user.email);
        // Derive initials from email prefix or name
        const displayName = user.profile?.name || user.email.split("@")[0];
        setUserInitials(displayName.slice(0, 2).toUpperCase());
      }
    });
  }, []);

  const handleSignOut = async () => {
    const res = await signOutAction();
    if (res.success) {
      router.push("/login");
      router.refresh();
    }
  };

  // Dispatch global custom event for command menu
  const triggerCmdK = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 h-full w-full bg-background border-l border-border/50">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-background/70 backdrop-blur-xl px-4 sm:px-6 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <SidebarTrigger className="-ml-1 sm:-ml-2 hover:bg-muted transition-colors rounded-xl p-2 shrink-0" />
              
              <Button 
                variant="outline" 
                className="hidden sm:flex relative justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80 rounded-xl bg-card hover:bg-muted border-border/50 shadow-soft"
                onClick={triggerCmdK}
              >
                <Search className="mr-2 h-4 w-4 shrink-0" />
                <span>Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground hover:text-foreground rounded-xl"
                onClick={triggerCmdK}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "relative h-9 w-9 rounded-full p-0 border-0 shrink-0")}>
                <Avatar className="h-9 w-9 border border-border/50 shadow-soft hover:shadow-md transition-shadow">
                  <AvatarFallback className="bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail || "Loading..."}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/pricing')}>
                    Billing
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-10 relative">
            <div className="mx-auto w-full max-w-6xl animate-slide-up-fade">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <CommandMenu />
    </SidebarProvider>
  );
}
