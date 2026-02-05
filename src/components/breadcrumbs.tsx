import { RouterLink } from './RouterLink'
import { Breadcrumbs } from './ui'

type BreadcrumbSegment = { name: string; href: string }

function buildAcquisitionCrumbs(
  acqId: string,
  gridId?: string,
  squareId?: string
): BreadcrumbSegment[] {
  const crumbs: BreadcrumbSegment[] = [
    { name: 'Acquisitions', href: '/' },
    { name: acqId.slice(0, 8), href: `/acquisitions/${acqId}` },
  ]
  if (gridId)
    crumbs.push({
      name: gridId.slice(0, 8),
      href: `/acquisitions/${acqId}/grids/${gridId}`,
    })
  if (squareId)
    crumbs.push({
      name: squareId.slice(0, 8),
      href: `/acquisitions/${acqId}/grids/${gridId}/squares/${squareId}`,
    })
  return crumbs
}

export { Breadcrumbs, buildAcquisitionCrumbs, RouterLink }
