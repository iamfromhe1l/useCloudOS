import { PillButton } from '@usecloud/ui'
export function Breadcrumbs({
  path,
  navigate,
}: {
  path: string
  navigate: (path: string) => void
}) {
  const segments = path.split('/').filter(Boolean)
  return (
    <nav aria-label="Storage path" className="flex min-w-0 gap-1 overflow-x-auto whitespace-nowrap">
      <PillButton tone="quiet" onClick={() => navigate('')}>
        Shared storage
      </PillButton>
      {segments.map((segment, index) => (
        <PillButton
          key={index}
          tone="quiet"
          onClick={() => navigate(segments.slice(0, index + 1).join('/'))}
        >
          <span className="max-w-48 truncate" title={segment}>
            {segment}
          </span>
        </PillButton>
      ))}
    </nav>
  )
}
