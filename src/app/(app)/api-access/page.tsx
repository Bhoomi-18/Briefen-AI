"use client"

import { ComingSoon } from "@/components/layout/coming-soon"

export default function ApiAccessPage() {
  return (
    <ComingSoon
      title="Developer API Access & Webhooks"
      description="Create access tokens and integrate webhooks to query whisper transcripts programmatically and push summaries directly to custom data stores."
      versionBadge="Available in Briefen v3"
      type="api-access"
    />
  )
}
