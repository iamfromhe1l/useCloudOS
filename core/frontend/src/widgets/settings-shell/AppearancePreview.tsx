import { Icon } from '@/shared/ui'
export function AppearancePreview() {
  return (
    <div
      aria-label="Theme preview"
      className="mb-5 grid grid-cols-[1fr_1fr] gap-3 rounded-shape-extra-large bg-surface-container-lowest p-3 sm:p-4"
    >
      <div className="flex min-h-24 flex-col justify-between rounded-shape-large bg-primary-container p-4 text-on-primary-container">
        <Icon name="cloud" className="size-7" />
        <p className="mt-4 text-title-medium font-semibold">Make it yours</p>
      </div>
      <div className="grid gap-2">
        <div className="rounded-shape-medium bg-secondary-container p-3 text-on-secondary-container">
          <span className="text-label-medium">Your space, your colors</span>
          <div className="mt-2 flex gap-1.5">
            <span className="size-5 rounded-full bg-primary" />
            <span className="size-5 rounded-full bg-secondary" />
            <span className="size-5 rounded-full bg-tertiary" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-shape-medium bg-tertiary-container p-3 text-on-tertiary-container">
          <Icon name="palette" className="size-5" />
          <span className="text-label-medium">Material You</span>
        </div>
      </div>
    </div>
  )
}
