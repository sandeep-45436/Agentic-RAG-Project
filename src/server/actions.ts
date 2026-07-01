"use server";

import { revalidatePath } from "next/cache";

export async function submitFeedback(formData: FormData) {
  // Example server action
  const feedback = formData.get("feedback");
  
  // Simulate DB insert
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  console.log("Feedback received:", feedback);
  
  // Revalidate if needed
  revalidatePath("/");
  
  return { success: true, message: "Feedback submitted successfully" };
}
