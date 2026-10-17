import { type Permission, permissionMetadata } from '@usecloud/manifest'

import { type InstalledApplication, useAppMutation } from '@/entities/application'
import { ErrorState } from '@/shared/ui'
import { Switch } from '@/shared/ui/selection'
export function ApplicationPermissions({ app }: { app: InstalledApplication }) {
  const mutation = useAppMutation()
  return (
    <section className="space-y-3">
      <h4 className="text-title-small">Permissions</h4>
      {app.manifest.permissions.map((id: Permission) => (
        <div key={id} className="space-y-1">
          <p className="text-body-medium">
            {permissionMetadata[id].title} ({permissionMetadata[id].risk} risk)
          </p>
          <Switch
            label={permissionMetadata[id].title + ' (' + permissionMetadata[id].risk + ' risk)'}
            checked={app.grants.includes(id)}
            disabled={mutation.isPending}
            onCheckedChange={(granted) =>
              mutation.mutate({
                path: '/api/v1/apps/' + app.manifest.metadata.id + '/permissions/' + id,
                method: 'PUT',
                body: JSON.stringify({ granted }),
              })
            }
          />
          <p className="text-body-small text-on-surface-variant">{id}</p>
        </div>
      ))}
      {mutation.isError && <ErrorState message={mutation.error.message} />}
      <p className="text-body-small">
        Revocation applies immediately at the gateway and restarts the service to remove OS-level
        grants. Shared user files are never application data.
      </p>
    </section>
  )
}
