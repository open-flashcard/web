import { PageHeader } from "@/components/page-header"
import { AppSettings } from "@/features/settings/settings"

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" />
      <AppSettings />
    </>
  )
}
