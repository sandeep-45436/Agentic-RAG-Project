"use client";
import { AnimatedBackground } from "@/components/animated-background";

import React, { use } from "react";
import FacultyProfilePage from "../page";

export default function DynamicFacultyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <FacultyProfilePage />;
}
