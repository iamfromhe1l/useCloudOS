import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { request } from '@/shared/api'
import { ErrorState, PillButton } from '@/shared/ui'
interface Publisher {
  keyId: string
  publisherId: string
  name: string
  trusted: boolean
  revoked: boolean
}
export function PublisherTrust() {
  const query = useQuery({
    queryKey: ['publishers'],
    queryFn: () => request<{ publishers: Publisher[] }>('/api/v1/publishers'),
  })
  const [input, setInput] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: string }) =>
      request<void>(path, {
        method: body ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
    onSuccess: async () => {
      setInput('')
      setConfirmed(false)
      await client.invalidateQueries({ queryKey: ['publishers'] })
      await client.invalidateQueries({ queryKey: ['platform'] })
    },
  })
  return (
    <section className="space-y-3">
      <h3 className="text-title-medium">Publisher trust</h3>
      <p className="text-body-small">
        Trusting a key allows its native and embedded code to run. Verify its full fingerprint
        through an independent trusted channel. A valid signature alone is not verification.
      </p>
      {query.isError ? (
        <p className="text-body-small">Publisher management requires administrator access.</p>
      ) : (
        <ul className="space-y-2">
          {query.data?.publishers.map((p) => (
            <li
              key={p.keyId}
              className="min-w-0 space-y-2 rounded-shape-medium bg-surface-container p-3"
            >
              <p>
                {p.name} · {p.revoked ? 'Revoked' : p.trusted ? 'Trusted' : 'Untrusted'}
              </p>
              <p className="text-mono-small break-all">{p.keyId}</p>
              {!p.revoked && (
                <PillButton
                  tone="danger"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ path: '/api/v1/publishers/' + p.keyId })}
                >
                  Revoke key and stop its apps
                </PillButton>
              )}
            </li>
          ))}
        </ul>
      )}
      <label className="block space-y-2">
        <span>Public publisher record (JSON, never a private key)</span>
        <textarea
          className="text-mono-small min-h-28 w-full rounded-shape-small border border-outline bg-surface p-3"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'{"keyId":"…","publicKey":"…","publisherId":"…","name":"…"}'}
        />
      </label>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I verified this fingerprint and trust this publisher's code
      </label>
      <PillButton
        disabled={!confirmed || !input || mutation.isPending}
        onClick={() => mutation.mutate({ path: '/api/v1/publishers', body: input })}
      >
        Trust publisher key
      </PillButton>
      {mutation.isError && <ErrorState message={mutation.error.message} />}
    </section>
  )
}
