import { AnimatedBackground } from "@/components/animated-background";
import { redirect } from "next/navigation";

export default function HODRootPage() {
  redirect("/hod/dashboard");
}
