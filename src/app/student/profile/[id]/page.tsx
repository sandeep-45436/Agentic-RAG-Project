"use client";

import React, { use } from "react";
import StudentProfilePage from "../page";

export default function DynamicStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <StudentProfilePage />;
}
