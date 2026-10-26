import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/stats";

export async function GET() {
  const { user, error } = await requireApiUser();
  if (error) return error;
  const stats = await getDashboardStats(user);
  return NextResponse.json(stats);
}
