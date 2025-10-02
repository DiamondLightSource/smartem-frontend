import type { Route } from './+types/product'

import {
  Container,
  ThemeProvider,
  Grid,
  CardContent,
  Card,
  CardHeader,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material'

import Avatar from 'boring-avatars'

import { useNavigate } from 'react-router'

import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'
import { useGetPredictionModels } from '../hooks/useApi'
import type { QualityPredictionModelResponse } from '../api/generated/models'

export default function PredictionModels() {
  const navigate = useNavigate()
  const { data: models, isLoading, error } = useGetPredictionModels()

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Container content="center" style={{ width: '100%', paddingTop: '50px' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">
            Error loading prediction models: {error.message}
          </Alert>
        ) : (
          <Grid container spacing={1}>
            {models?.map((model: QualityPredictionModelResponse) => {
              return (
                <Grid size={4} key={model.name}>
                  <Card variant="outlined">
                    <CardHeader
                      avatar={
                        <Avatar name={model.name} variant="ring" size={60} />
                      }
                      title={model.name}
                    />
                    <CardContent>{model.description}</CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Container>
    </ThemeProvider>
  )
}
