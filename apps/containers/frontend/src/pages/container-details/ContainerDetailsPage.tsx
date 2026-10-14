import { useParams } from 'react-router-dom'

import { ContainerDetailsApp } from '@/widgets/container-details'
export function ContainerDetailsPage() {
  const { id = '' } = useParams()
  return <ContainerDetailsApp id={id} />
}
