"use client"

import { ComingSoon } from "@/components/layout/coming-soon"

export default function IntegrationsPage() {
  return (
    <ComingSoon
      title="Slack & Calendar Integrations"
      description="Connect third-party integrations (Slack, Notion, Zoom, Google Meet) to automatically sync meetings, trigger notifications, and log action items."
      versionBadge="Available in Briefen v2"
      type="integrations"
    />
  )
}
