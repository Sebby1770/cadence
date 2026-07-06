import { PageHeader, PageShell } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'

export default function Leave() {
  return (
    <PageShell>
      <PageHeader title="Leave" subtitle="This view is being assembled." />
      <Card className="p-10 text-center text-sm text-muted-foreground">Loading Leave…</Card>
    </PageShell>
  )
}
