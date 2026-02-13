import { DensityMedium, Science } from '@mui/icons-material'
import HomeFilledIcon from '@mui/icons-material/HomeFilled'
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
} from '@mui/material'
import AppBar from '@mui/material/AppBar'
import { useNavigate } from '@tanstack/react-router'
import React from 'react'

export const Navbar = () => {
  const navigate = useNavigate()

  const [drawer, setDrawer] = React.useState(false)

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar component="nav" position="sticky" style={{ top: 0 }} enableColorOnDark={true}>
        <Toolbar>
          <Stack direction="row" spacing={3}>
            <IconButton
              edge="start"
              onClick={() => {
                setDrawer(true)
              }}
            >
              <DensityMedium />
            </IconButton>
            <IconButton edge="start" onClick={() => navigate({ to: '/' })}>
              <HomeFilledIcon />
            </IconButton>
          </Stack>
          <Stack sx={{ marginLeft: 'auto' }} direction="row" spacing={3}>
            <Box
              component="img"
              src={'/fragment-screen-logo.png'}
              width={30}
              onClick={() => {
                window.open('https://fragmentscreen.org', '_blank')
              }}
              style={{ cursor: 'pointer' }}
            />
            <Box
              component="img"
              src={'/favicon.ico'}
              width={30}
              onClick={() => {
                window.open(
                  'https://www.diamond.ac.uk/Instruments/Biological-Cryo-Imaging/eBIC.html',
                  '_blank'
                )
              }}
              style={{ cursor: 'pointer' }}
            />
          </Stack>
        </Toolbar>
      </AppBar>
      <Drawer
        open={drawer}
        onClose={() => {
          setDrawer(!drawer)
        }}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => {
            setDrawer(false)
          }}
        >
          <List>
            <ListItem>
              <ListItemButton
                onClick={() => {
                  navigate({ to: '/models' })
                }}
              >
                <ListItemIcon>
                  <Science />
                </ListItemIcon>
                <ListItemText primary="Models" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  )
}
