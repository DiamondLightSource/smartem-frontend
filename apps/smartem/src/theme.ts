import { createTheme } from '@mui/material/styles'

const gray = {
  50: '#f0f2f4',
  100: '#f6f8fa',
  200: '#e8eaed',
  300: '#d1d9e0',
  400: '#afb8c1',
  500: '#8b949e',
  600: '#656d76',
  700: '#424a53',
  900: '#1f2328',
} as const

const statusColors = {
  running: '#1a7f37',
  idle: '#0969da',
  paused: '#bf8700',
  error: '#cf222e',
  offline: gray[600],
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
      main: gray[600],
      dark: gray[700],
      light: gray[500],
    },
    error: { main: statusColors.error },
    warning: { main: statusColors.paused },
    success: { main: statusColors.running },
    info: { main: statusColors.idle },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    divider: gray[300],
    text: {
      primary: gray[900],
      secondary: gray[600],
      disabled: gray[500],
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
      color: gray[600],
    },
    body1: { fontSize: '0.875rem', lineHeight: 1.5, letterSpacing: '-0.003em' },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, letterSpacing: '-0.003em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, color: gray[600] },
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
          color: gray[900],
          borderBottom: `1px solid ${gray[300]}`,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${gray[300]}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${gray[300]}`,
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
          borderColor: gray[300],
          '&:hover': {
            borderColor: gray[400],
            backgroundColor: gray[100],
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          padding: '8px 16px',
          borderColor: gray[300],
        },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          color: gray[600],
          backgroundColor: gray[100],
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: gray[100],
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
          backgroundColor: gray[900],
        },
      },
    },
  },
})

export { gray, statusColors, theme }
