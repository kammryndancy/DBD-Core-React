import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<SvgIconProps>;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps): JSX.Element {
  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
          <Typography variant="h4">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color }}>
          <Icon sx={{ fontSize: 40 }} />
        </Box>
      </Box>
    </Paper>
  );
}

StatCard.displayName = 'StatCard';

function Dashboard(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        PVX Processing Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vendors"
            value={1234}
            icon={PeopleIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={567}
            icon={AccountBalanceIcon}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Processed Files"
            value={489}
            icon={AssessmentIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Issues"
            value={12}
            icon={WarningIcon}
            color="#d32f2f"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

Dashboard.displayName = 'Dashboard';

export default Dashboard;
