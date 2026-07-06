import { PageHeader, PageShell } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'

export default function Admin() {
  return (
    <PageShell>
      <PageHeader title="Admin" subtitle="This view is being assembled." />
      <Card className="p-10 text-center text-sm text-muted-foreground">Loading Admin…</Card>
    </PageShell>
  )
}
