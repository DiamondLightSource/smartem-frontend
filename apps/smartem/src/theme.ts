import { createTheme } from '@mui/material/styles'

const statusColors = {
  running: '#1a7f37',
  idle: '#0969da',
  paused: '#bf8700',
  error: '#cf222e',
  offline: '#656d76',
} as const

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0969da',
      dark: '#0550ae',
      light: '#54aeff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#656d76',
      dark: '#424a53',
      light: '#8b949e',
    },
    error: { main: statusColors.error },
    warning: { main: statusColors.paused },
    success: { main: statusColors.running },
    info: { main: statusColors.idle },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    divider: '#d1d9e0',
    text: {
      primary: '#1f2328',
      secondary: '#656d76',
      disabled: '#8b949e',
    },
  },
  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    fontSize: 13,
    htmlFontSize: 16,
    h1: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 },
    h2: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 },
    h3: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.25 },
    h4: { fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.5 },
    h5: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    h6: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: '#656d76',
    },
    body1: { fontSize: '0.875rem', lineHeight: 1.5, letterSpacing: '-0.003em' },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, letterSpacing: '-0.003em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, color: '#656d76' },
    button: {
      fontSize: '0.8125rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '-0.003em',
    },
  },
  shape: { borderRadius: 6 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"tnum"',
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1f2328',
          borderBottom: '1px solid #d1d9e0',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #d1d9e0',
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #d1d9e0',
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
          borderRadius: 12,
        },
        sizeSmall: {
          height: 20,
          fontSize: '0.6875rem',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
        sizeSmall: {
          fontSize: '0.75rem',
          padding: '2px 10px',
        },
        outlined: {
          borderColor: '#d1d9e0',
          '&:hover': {
            borderColor: '#afb8c1',
            backgroundColor: '#f6f8fa',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          padding: '8px 16px',
          borderColor: '#d1d9e0',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          color: '#656d76',
          backgroundColor: '#f6f8fa',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f6f8fa',
          },
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          backgroundColor: '#1f2328',
        },
      },
    },
  },
})

export { statusColors, theme }
