import { PageHeader, PageShell } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'

export default function Profile() {
  return (
    <PageShell>
      <PageHeader title="Profile" subtitle="This view is being assembled." />
      <Card className="p-10 text-center text-sm text-muted-foreground">Loading Profile…</Card>
    </PageShell>
  )
}
