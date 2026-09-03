"use client"

import { ComingSoon } from "@/components/layout/coming-soon"

export default function AdminPage() {
  return (
    <ComingSoon
      title="System Administrator Dashboard"
      description="Manage global seat licensing metrics, enforce system organization policies, customize layouts, and overview activity logs indices."
      versionBadge="Available in Enterprise Edition"
      type="admin"
    />
  )
}
