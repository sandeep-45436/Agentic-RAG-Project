"use client";

import { createContext, useContext } from "react";

export interface HODSessionContextType {
  session: any | null;
  activeDepartment: string;
  setActiveDepartment: (dept: string) => void;
  departments: Array<{ id: string; code: string; name: string; building?: string }>;
  isDean: boolean;
}

export const HODContext = createContext<HODSessionContextType>({
  session: null,
  activeDepartment: "CS",
  setActiveDepartment: () => {},
  departments: [],
  isDean: false,
});

export const useHOD = () => useContext(HODContext);
