export interface WorldStateSnapshot {
  currentSemester: string;
  academicCalendar: {
    isExamPeriod: boolean;
    registrationOpen: boolean;
    holidayActive: boolean;
  };
  activeUserContext: {
    userId: string;
    userRole: string;
    department: string;
  };
  systemHealth: {
    databaseStatus: "HEALTHY" | "DEGRADED";
    vectorDbStatus: "HEALTHY" | "DEGRADED";
  };
  runningJobsCount: number;
  pendingApprovalsCount: number;
  timestamp: string;
}

export class WorldStateManager {
  public static getSnapshot(userId: string = "default-user", userRole: string = "ADMIN"): WorldStateSnapshot {
    return {
      currentSemester: "Fall 2026",
      academicCalendar: {
        isExamPeriod: false,
        registrationOpen: true,
        holidayActive: false,
      },
      activeUserContext: {
        userId,
        userRole,
        department: "COMPUTER_SCIENCE",
      },
      systemHealth: {
        databaseStatus: "HEALTHY",
        vectorDbStatus: "HEALTHY",
      },
      runningJobsCount: 0,
      pendingApprovalsCount: 1,
      timestamp: new Date().toISOString(),
    };
  }
}
