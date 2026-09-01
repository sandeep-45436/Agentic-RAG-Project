"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  LayoutDashboard,
  Settings2,
  FileText,
  LogOut,
  Sparkles,
  BarChart2,
  MessageSquare,
  Search,
  GraduationCap,
  Scale,
  FlaskConical,
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
  { title: "Faculty Portal", url: "/faculty/dashboard", icon: GraduationCap },
  { title: "HOD Portal", url: "/hod/dashboard", icon: Scale },
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
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-cyan-500 text-white shadow-soft">
                <Sparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-bold">NexusIQ</span>
                <span className="truncate text-xs text-muted-foreground font-medium">University AI Assistant</span>
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
