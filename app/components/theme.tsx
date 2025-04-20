import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    components: {
      MuiTableRow: {
        styleOverrides: {
            head: {
                backgroundColor: '#c165c7',
            },
        },
      },
      MuiTableCell: {
        styleOverrides: {
            head: {
                backgroundColor: '#c165c7',
            },
        },
      },
      MuiDrawer: {
        styleOverrides: {
            paper: {
                backgroundColor: '#1bafa5',
            },
        },
      },
      MuiCard: {
        styleOverrides: {
            root: {
                backgroundColor: '#b927d9',
            }
        },
      },
    },
    palette: {
      primary: {
        main: '#1bafa5',
      },
      secondary: {
        main: '#b927d9',
      },
      mode: "dark",
    },
  });
