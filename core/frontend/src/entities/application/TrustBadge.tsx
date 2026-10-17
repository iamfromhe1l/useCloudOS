import type { TrustLevel } from '@usecloud/manifest'

import { StatusChip, Tooltip } from '@/shared/ui'
export function TrustBadge({
  trust,
  publisher,
  revoked,
}: {
  trust: TrustLevel
  publisher?: string
  revoked?: boolean
}) {
  const label =
    trust === 'verified'
      ? 'Verified publisher'
      : trust === 'signed'
        ? 'Signed publisher'
        : 'Unsigned package'
  const description =
    trust === 'verified'
      ? 'Signature verified against a locally trusted publisher key.'
      : trust === 'signed'
        ? 'Signature is valid; this publisher key is not trusted by this platform.'
        : 'No cryptographic publisher signature. Install only if you trust the source.'
  return (
    <Tooltip label={description}>
      <span>
        <StatusChip tone={revoked ? 'error' : trust === 'verified' ? 'success' : 'warning'}>
          {revoked ? 'Revoked publisher' : label}
          {publisher ? ' · ' + publisher : ''}
        </StatusChip>
      </span>
    </Tooltip>
  )
}
