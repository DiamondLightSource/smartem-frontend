import { useEffect, useState } from 'react'
import { Snackbar, Alert, Button } from '@mui/material'
import { logApiVersion, checkApiVersion } from '../api/version-check'

export function ApiVersionCheck() {
  const [versionMismatch, setVersionMismatch] = useState(false)
  const [versionInfo, setVersionInfo] = useState<{
    clientVersion: string
    serverVersion: string | null
  } | null>(null)

  useEffect(() => {
    const checkVersion = async () => {
      const info = await checkApiVersion()
      if (import.meta.env.DEV) {
        logApiVersion()
      }
      if (!info.compatible) {
        setVersionMismatch(true)
        setVersionInfo({
          clientVersion: info.clientVersion,
          serverVersion: info.serverVersion,
        })
      }
    }
    checkVersion()
  }, [])

  const handleDismiss = () => {
    setVersionMismatch(false)
  }

  return (
    <Snackbar
      open={versionMismatch}
      onClose={handleDismiss}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="warning"
        onClose={handleDismiss}
        action={
          <Button color="inherit" size="small" onClick={handleDismiss}>
            Dismiss
          </Button>
        }
      >
        API version mismatch: client expects{' '}
        {versionInfo?.clientVersion?.slice(0, 20)}
        {versionInfo?.clientVersion && versionInfo.clientVersion.length > 20
          ? '...'
          : ''}{' '}
        but server is{' '}
        {versionInfo?.serverVersion?.slice(0, 20)}
        {versionInfo?.serverVersion && versionInfo.serverVersion.length > 20
          ? '...'
          : ''}
      </Alert>
    </Snackbar>
  )
}
