import { Icon } from '@usecloud/ui'
export function Breadcrumbs({
  path,
  navigate,
}: {
  path: string
  navigate: (path: string) => void
}) {
  const segments = path.split('/').filter(Boolean)
  return (
    <nav
      aria-label="Storage path"
      className="flex min-w-0 items-center gap-1 overflow-x-auto text-label-large whitespace-nowrap"
    >
      <button
        onClick={() => navigate('')}
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-shape-small px-3 hover:bg-secondary-container"
      >
        <Icon name="folder" className="size-5" />
        Shared storage
      </button>
      {segments.map((segment, index) => (
        <span key={index} className="flex shrink-0 items-center">
          <Icon name="chevronRight" className="size-4 text-on-surface-variant" />
          <button
            aria-current={index === segments.length - 1 ? 'location' : undefined}
            onClick={() => navigate(segments.slice(0, index + 1).join('/'))}
            className="min-h-11 max-w-48 truncate rounded-shape-small px-3 hover:bg-secondary-container aria-[current=location]:text-primary"
            title={segment}
          >
            {segment}
          </button>
        </span>
      ))}
    </nav>
  )
}
