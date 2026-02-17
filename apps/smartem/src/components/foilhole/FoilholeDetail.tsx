import { Box, Typography } from '@mui/material'
import { useState } from 'react'
import type { MockFoilHole, MockMicrograph } from '~/data/mock-session-detail'
import { statusColors } from '~/theme'
import { qualityColor } from '~/utils/heatmap'

const processingStatusColors: Record<MockMicrograph['processingStatus'], string> = {
  completed: statusColors.running,
  processing: statusColors.idle,
  pending: statusColors.paused,
  failed: statusColors.error,
}

interface FoilholeDetailProps {
  foilhole: MockFoilHole
  micrographs: MockMicrograph[]
  onBack: () => void
}

export function FoilholeDetail({ foilhole, micrographs, onBack }: FoilholeDetailProps) {
  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: Foilhole metadata */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            component="button"
            onClick={onBack}
            sx={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'text.secondary',
              fontSize: '0.75rem',
              p: 0,
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': { color: 'text.primary' },
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              role="img"
              aria-label="Back"
            >
              <path
                d="M7.5 2.5L4 6l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to square
          </Box>

          <Typography variant="h4" sx={{ mb: 1 }}>
            {foilhole.foilholeId}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 3,
                fontSize: '0.6875rem',
                fontWeight: 500,
                backgroundColor:
                  foilhole.status === 'processed'
                    ? `${statusColors.running}18`
                    : foilhole.status === 'acquired'
                      ? `${statusColors.paused}18`
                      : '#f0f2f4',
                color:
                  foilhole.status === 'processed'
                    ? statusColors.running
                    : foilhole.status === 'acquired'
                      ? statusColors.paused
                      : statusColors.offline,
              }}
            >
              {foilhole.status}
            </Box>
          </Box>

          <MetadataRow label="Quality">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: qualityColor(foilhole.quality),
                }}
              />
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(foilhole.quality * 100)}%
              </Typography>
            </Box>
          </MetadataRow>
          <MetadataRow label="Diameter">
            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {foilhole.diameter} nm
            </Typography>
          </MetadataRow>
          <MetadataRow label="Position">
            <Typography
              variant="body2"
              sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}
            >
              ({foilhole.xLocation}, {foilhole.yLocation})
            </Typography>
          </MetadataRow>
          <MetadataRow label="Micrographs">
            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {foilhole.micrographCount}
            </Typography>
          </MetadataRow>

          {foilhole.isNearGridBar && (
            <Box
              sx={{
                mt: 2,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                backgroundColor: `${statusColors.paused}12`,
                border: `1px solid ${statusColors.paused}30`,
              }}
            >
              <Typography variant="caption" sx={{ color: statusColors.paused, fontWeight: 500 }}>
                Near grid bar
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Right: Micrograph cards */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="h5" sx={{ mb: 1.5 }}>
          Micrographs
        </Typography>
        {micrographs.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No micrographs acquired yet
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 1.5,
            }}
          >
            {micrographs.map((mic) => (
              <MicrographCard key={mic.uuid} micrograph={mic} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

function MetadataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      {children}
    </Box>
  )
}

function MicrographCard({ micrograph }: { micrograph: MockMicrograph }) {
  const [expanded, setExpanded] = useState(false)
  const statusColor = processingStatusColors[micrograph.processingStatus]

  return (
    <Box
      onClick={() => setExpanded((p) => !p)}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': { borderColor: '#afb8c1' },
      }}
    >
      {/* Placeholder image */}
      <Box
        sx={{
          height: 100,
          backgroundColor: '#e8eaed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem' }}>
          {micrograph.micrographId}
        </Typography>
      </Box>

      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
            {micrograph.micrographId}
          </Typography>
          <Box
            sx={{
              px: 0.75,
              py: 0.125,
              borderRadius: 2,
              fontSize: '0.625rem',
              fontWeight: 500,
              backgroundColor: `${statusColor}18`,
              color: statusColor,
            }}
          >
            {micrograph.processingStatus}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem' }}>
          {new Date(micrograph.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>

        {micrograph.processingStatus === 'completed' && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 0.25, fontVariantNumeric: 'tabular-nums' }}
          >
            {micrograph.resolution} A resolution
          </Typography>
        )}

        {expanded && micrograph.processingStatus === 'completed' && (
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <DetailRow label="Defocus" value={`${micrograph.defocus} um`} />
            <DetailRow label="Astigmatism" value={`${micrograph.astigmatism} um`} />
            <DetailRow label="Motion total" value={`${micrograph.motionTotal} A`} />
            <DetailRow label="CTF fit" value={`${micrograph.ctfFitResolution} A`} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem' }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.625rem' }}
      >
        {value}
      </Typography>
    </Box>
  )
}
