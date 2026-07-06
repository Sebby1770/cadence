import { PageHeader, PageShell } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'

export default function WhosWorking() {
  return (
    <PageShell>
      <PageHeader title="WhosWorking" subtitle="This view is being assembled." />
      <Card className="p-10 text-center text-sm text-muted-foreground">Loading WhosWorking…</Card>
    </PageShell>
  )
}
