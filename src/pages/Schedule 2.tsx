import { PageHeader, PageShell } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'

export default function Schedule() {
  return (
    <PageShell>
      <PageHeader title="Schedule" subtitle="This view is being assembled." />
      <Card className="p-10 text-center text-sm text-muted-foreground">Loading Schedule…</Card>
    </PageShell>
  )
}
