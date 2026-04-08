import { NextResponse } from "next/server"
import { requireOwnerAdmin } from "@/lib/admin-security"
import { listAllGarages, updateGarageStatus } from "@/lib/garage-db"
import { listEmployees } from "@/lib/garage-employee-db"
import { findAccountById } from "@/lib/accounts-db"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = await requireOwnerAdmin(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })

  const garages = await listAllGarages()

  const garagesWithMembers = await Promise.all(
    garages.map(async (garage) => {
      const members: { email: string; role: "manager" | "employee"; status: string }[] = []

      // Add manager
      if (garage.managerUserId) {
        const manager = await findAccountById(garage.managerUserId)
        if (manager) {
          members.push({ email: manager.email, role: "manager", status: "active" })
        }
      }

      // Add employees
      const employees = await listEmployees(garage.id)
      for (const emp of employees) {
        members.push({ email: emp.email, role: "employee", status: emp.status })
      }

      return { ...garage, members }
    })
  )

  return NextResponse.json({ ok: true, garages: garagesWithMembers })
}

export async function POST(req: Request) {
  const auth = await requireOwnerAdmin(req)
  if (!auth) return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { garageId, action, reason } = body ?? {}

  if (!garageId || !["approve", "suspend"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 })
  }

  const status = action === "approve" ? "approved" : "suspended"
  await updateGarageStatus(garageId, status, reason)

  return NextResponse.json({ ok: true })
}
