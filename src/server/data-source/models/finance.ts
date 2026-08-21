export interface UniversityFinance {
  id: string;
  studentId: string;
  totalBilled: number;
  totalPaid: number;
  balanceOutstanding: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  organizationId: string;
}
