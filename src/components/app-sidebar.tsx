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
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Award,
  Building2,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction } from "@/server/actions/auth";

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
    label: "Student Portal",
    items: [
      { title: "Student Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "AI Academic Chat", url: "/chat", icon: MessageSquare },
      { title: "Browse Notes & Docs", url: "/documents", icon: BookOpen },
      { title: "Knowledge Bases", url: "/knowledge-bases", icon: FileText },
      { title: "Research Workspace", url: "/research", icon: BookMarked },
    ],
  },
  {
    label: "Placement Center",
    items: [
      { title: "Placement Center", url: "/skills", icon: Zap, badge: "Radar" },
      { title: "Assessment Arena", url: "/skills/assessment", icon: Award, badge: "Tests" },
      { title: "Certifications", url: "/skills/certifications", icon: CheckCircle2, badge: "Badges" },
    ],
  },
  {
    label: "Faculty Operations",
    items: [
      { title: "Faculty Dashboard", url: "/faculty/dashboard", icon: GraduationCap, badge: "Cockpit" },
      { title: "Class Timetables", url: "/faculty/timetables", icon: Calendar },
      { title: "Exam Seating", url: "/faculty/seating", icon: Users, badge: "Halls" },
      { title: "Upload Course Docs", url: "/faculty/documents", icon: FileText },
      { title: "Assigned Faculty", url: "/faculty/assigned-faculty", icon: Building2 },
    ],
  },
  {
    label: "HOD Governance",
    items: [
      { title: "Department Command", url: "/hod/dashboard", icon: Scale, badge: "HQ" },
      { title: "Approval Docket", url: "/hod/approvals", icon: CheckCircle2, badge: "Leaves" },
      { title: "Faculty Workload", url: "/hod/faculty", icon: Users },
      { title: "Student Risk Radar", url: "/hod/students", icon: ShieldAlert, badge: "Risks" },
      { title: "Master Timetable", url: "/hod/timetable", icon: Calendar },
      { title: "Courses & Syllabi", url: "/hod/courses", icon: BookOpen },
      { title: "Research Grants", url: "/hod/research", icon: Award },
    ],
  },
  {
    label: "Principal Leadership",
    items: [
      { title: "Executive Cockpit", url: "/principal", icon: Landmark, badge: "Executive" },
      { title: "9-Department Matrix", url: "/principal/departments", icon: Building2, badge: "9 Depts" },
      { title: "Approvals Registry", url: "/principal/approvals", icon: CheckCircle2 },
      { title: "Budget & Finance", url: "/principal/finance", icon: DollarSign, badge: "Grants" },
    ],
  },
  {
    label: "Platform Intelligence",
    items: [
      { title: "Autonomous Agents", url: "/agents", icon: Bot, badge: "AI" },
      { title: "Analytics & Usage", url: "/analytics", icon: BarChart2 },
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
                  const isActive = pathname === item.url;
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
                          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-600"
                          }`}>
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
