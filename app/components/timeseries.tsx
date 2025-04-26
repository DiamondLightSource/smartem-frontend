import { Avatar, Box, Grid, Slider, Switch, List, ListItem, ListItemText, ListItemAvatar, Skeleton } from "@mui/material";
import { LineChart } from '@mui/x-charts';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import React from "react";

export const TimeSeriesChart = ({ xData, yData }: { xData: number[] | Date[], yData: number[] }) => {
    const [axisRange, setAxisRange] = React.useState([0, xData.length]);
    const [timeScale, setTimeScale] = React.useState(true);
  
    const average = yData.length === 0 ? 0: yData.reduce((a: number, b: number) => a + b, 0) / yData.length;
    const averageLastTenPercent = yData.length === 0 ? 0: yData.slice(-(yData.length / 10)).reduce((a: number, b: number) => a + b, 0) / (yData.length / 10);
    const sdev = yData.length === 0 ? 0: Math.sqrt(yData.map((x: number) => Math.pow(x - average, 2)).reduce((a: number, b: number) => a + b) / yData.length);
    const current = yData.length === 0 ? 0 :yData.slice(-1)[0];
  
    const valueFormatter = (date, context) => {
      return timeScale ? 
        context.location === 'tick' ? 
        `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${(date.getMilliseconds()/100).toPrecision(1)}`:
        `${new Date(date)}`:
        date.toString();
    }
  
    return (xData.length === 0 || yData.length === 0) ?
        <Box sx={{ borderColor: "#b927d9", borderWidth: 5, borderRadius: "10px", padding: "20px" }}>
        <Grid container spacing={2} columns={{ xs: 10 }}>
        <Grid size={8}>
            <Skeleton variant="rounded" height={400}/>
            <Slider min={0} max={1} />
        </Grid>
        <Grid size={2}>
            <Skeleton variant="rounded" height={400}/>
        </Grid>
        </Grid>
        </Box> :
        <Box sx={{ borderColor: "#b927d9", borderWidth: 5, borderRadius: "10px", padding: "20px" }}>
        <Grid container spacing={2} columns={{ xs: 10 }}>
        <Grid size={8}>
            <LineChart
                hideLegend
                xAxis={[{ 
                data: timeScale ? xData: Array.from({length: xData.length}, (x, i) => i + 1), 
                min: timeScale ? xData[axisRange[0]]: axisRange[0] + 1, 
                max: timeScale ? xData[axisRange[1]]: axisRange[1] + 1, 
                scaleType: timeScale ? "time": "linear", 
                valueFormatter: valueFormatter,
                }]}
                grid={{ horizontal: true }}
                series={[{ data: yData, color: "#5C9EAD" }]}
                yAxis={[{ min: 0, max: 1 }]}
                height={400}
            />        
            <Slider min={0} max={xData.length} value={axisRange} onChange={(event: Event, newValue: number[]) => setAxisRange(newValue)} />
        </Grid>
        <Grid size={2}>
            <List>
            <ListItem style={{ backgroundColor: "#303030", margin: "2px" }}>
                <ListItemText primary={"Mean"} secondary={average.toLocaleString(undefined, { maximumSignificantDigits: 3 })} />
            </ListItem>
            <ListItem style={{ backgroundColor: "#303030", margin: "2px" }}>
                <ListItemText primary={"Current value"} secondary={current.toLocaleString(undefined, { maximumSignificantDigits: 3 })} />
                <ListItemAvatar>
                <Avatar sx={{ bgcolor: "#b927d9" }}>
                    {current > averageLastTenPercent ? <ArrowUpwardIcon/>: <ArrowDownwardIcon/>}
                </Avatar>
                </ListItemAvatar>
            </ListItem>
            <ListItem style={{ backgroundColor: "#303030", margin: "2px" }}>
                <ListItemText primary={"Standard deviation"} secondary={sdev.toLocaleString(undefined, { maximumSignificantDigits: 3 })} />
                <ListItemText style={{ color: sdev > 0.2 ? "red": sdev > 0.1 ? "yellow": "green", textAlign: "center" }} primary={sdev > 0.2 ? "Highly uncertain": sdev > 0.1 ? "Uncertain": "Confident"} />
            </ListItem>
            <ListItem style={{ backgroundColor: "#303030", margin: "2px" }}>
                <ListItemText primary={"Time scale"} />
                <Switch defaultChecked={true} onChange={(event) => {setTimeScale(!timeScale)}} />
            </ListItem>
            </List>
        </Grid>
        </Grid>
        </Box>
  }