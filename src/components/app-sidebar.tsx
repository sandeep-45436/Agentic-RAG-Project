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
} from "@/components/ui/sidebar";

const studentNav = [
  { title: "Chat Assistant", url: "/chat", icon: MessageSquare },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Placement Center", url: "/skills", icon: Zap },
  { title: "Research Workspace", url: "/research", icon: BookMarked },
  { title: "Browse Notes & Docs", url: "/documents", icon: BookOpen },
  { title: "Knowledge Bases", url: "/knowledge-bases", icon: BookOpen },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Analytics", url: "/analytics", icon: BarChart2 },
  { title: "RAG Evaluation", url: "/evaluation", icon: FlaskConical },
  { title: "Settings", url: "/settings", icon: Settings2 },
];

const facultyAdminNav = [
  { title: "Chat Assistant", url: "/chat", icon: MessageSquare },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Placement Center", url: "/skills", icon: Zap },
  { title: "Principal Portal", url: "/principal", icon: Landmark },
  { title: "Faculty Portal", url: "/faculty/dashboard", icon: GraduationCap },
  { title: "HOD Portal", url: "/hod/dashboard", icon: Scale },
  { title: "Research Workspace", url: "/research", icon: BookMarked },
  { title: "Knowledge Bases", url: "/knowledge-bases", icon: BookOpen },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Analytics", url: "/analytics", icon: BarChart2 },
  { title: "RAG Evaluation", url: "/evaluation", icon: FlaskConical },
  { title: "Settings", url: "/settings", icon: Settings2 },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isFacultyOrAdmin, setIsFacultyOrAdmin] = React.useState<boolean>(false);

  React.useEffect(() => {
    getCurrentUserRoleAction().then((res: any) => {
      setIsFacultyOrAdmin(Boolean(res?.isFacultyOrAdmin));
    });
  }, []);

  const navItems = isFacultyOrAdmin ? facultyAdminNav : studentNav;

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
      <SidebarContent>
        <SidebarMenu className="px-2 mt-4 space-y-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={pathname.startsWith(item.url)} tooltip={item.title} render={<Link href={item.url} />} className="rounded-md data-[active=true]:bg-muted data-[active=true]:font-medium text-muted-foreground hover:text-foreground">
                <item.icon className="text-foreground/70" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
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
