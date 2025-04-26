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
                backgroundColor: '#5C9EAD',
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
        main: '#5C9EAD',
      },
      secondary: {
        main: '#b927d9',
      },
      mode: "dark",
    },
  });
