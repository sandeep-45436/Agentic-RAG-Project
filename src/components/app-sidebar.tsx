"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  LayoutDashboard,
  Settings2,
  LogOut,
  Sparkles,
  BarChart2,
  MessageSquare,
  GraduationCap,
  Scale,
  FlaskConical,
  BookMarked,
  Zap,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction, getCurrentUserRoleAction } from "@/server/actions/auth";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Academic Essentials",
    items: [
      { title: "Student Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Chat Assistant", url: "/chat", icon: MessageSquare },
      { title: "Browse Notes & Docs", url: "/documents", icon: BookOpen },
      { title: "Knowledge Bases", url: "/knowledge-bases", icon: BookOpen },
      { title: "Research Workspace", url: "/research", icon: BookMarked },
    ],
  },
  {
    label: "Placement Center",
    items: [
      { title: "Placement Center", url: "/skills", icon: Zap, badge: "Career" },
    ],
  },
  {
    label: "Campus Leadership Portals",
    items: [
      { title: "Principal Portal", url: "/principal", icon: Landmark, badge: "Executive" },
      { title: "Faculty Portal", url: "/faculty/dashboard", icon: GraduationCap, badge: "Academic" },
      { title: "HOD Portal", url: "/hod/dashboard", icon: Scale, badge: "Dept" },
    ],
  },
  {
    label: "Platform Intelligence",
    items: [
      { title: "Agents", url: "/agents", icon: Bot },
      { title: "Analytics", url: "/analytics", icon: BarChart2 },
      { title: "RAG Evaluation", url: "/evaluation", icon: FlaskConical },
      { title: "Settings", url: "/settings", icon: Settings2 },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const res = await signOutAction();
    if (res.success) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-background" {...props}>
      <SidebarHeader className="border-b border-border py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} className="hover:bg-muted transition-colors rounded-md">
              <div className="flex size-9 items-center justify-center shrink-0">
                <img src="/images/college-logo.png" alt="ALITS" className="h-8 w-auto object-contain" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-bold text-slate-900">ALITS NexusIQ</span>
                <span className="truncate text-[10px] text-slate-500 font-medium">Anantha Lakshmi Inst. of Tech</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2 space-y-4">
        {navSections.map((section) => (
          <SidebarGroup key={section.label} className="p-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-700 px-2 mb-1">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link href={item.url} />}
                        className="rounded-lg data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-700 data-[active=true]:font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                      >
                        <item.icon className={isActive ? "text-indigo-600" : "text-slate-700"} />
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log out" onClick={handleSignOut} className="rounded-md text-muted-foreground hover:text-foreground">
              <LogOut className="text-foreground/70" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
