import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Grid,
  ThemeProvider,
} from '@mui/material'
import Avatar from 'boring-avatars'
import { useGetPredictionModelsPredictionModelsGet } from '../api/generated/default/default'
import type { QualityPredictionModelResponse } from '../api/generated/models'
import { Navbar } from '../components/navbar'
import { theme } from '../components/theme'

export default function PredictionModels() {
  const { data: models, isLoading, error } = useGetPredictionModelsPredictionModelsGet()

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Container content="center" style={{ width: '100%', paddingTop: '50px' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Error loading prediction models: {String(error)}</Alert>
        ) : (
          <Grid container spacing={1}>
            {models?.map((model: QualityPredictionModelResponse) => {
              return (
                <Grid size={4} key={model.name}>
                  <Card variant="outlined">
                    <CardHeader
                      avatar={<Avatar name={model.name} variant="ring" size={60} />}
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
