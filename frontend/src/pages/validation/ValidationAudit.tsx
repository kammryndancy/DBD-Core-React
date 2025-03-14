import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLogs } from '../../store/slices/validationSlice';
import moment from 'moment';

interface AuditLog {
  id: string;
  module: 'AP' | 'AR';
  entity: string;
  recordId: string;
  validationResult: boolean;
  errors: {
    field: string;
    type: string;
    message: string;
    legacyValue?: string;
    convertedValue?: string;
  }[];
  validationTimestamp: string;
  createdBy: string;
}

const ValidationAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AP' | 'AR'>('AP');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dispatch = useDispatch();
  const { auditLogs, loading, error } = useSelector((state: any) => state.validation);

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  const columns: GridColDef[] = [
    { 
      field: 'validationResult',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {params.value ? (
            <SuccessIcon color="success" />
          ) : (
            <ErrorIcon color="error" />
          )}
        </Box>
      )
    },
    { field: 'entity', headerName: 'Entity', flex: 1 },
    { field: 'recordId', headerName: 'Record ID', flex: 1 },
    {
      field: 'dataTypeConversions',
      headerName: 'Data Type Conversions',
      flex: 2,
      renderCell: (params) => {
        const conversions = params.row.errors?.filter(
          (e: any) => e.legacyValue && e.convertedValue
        ) || [];
        
        return conversions.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {conversions.map((conv: any, idx: number) => (
              <Chip
                key={idx}
                label={`${conv.field}: ${conv.legacyValue} → ${conv.convertedValue}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        ) : 'No conversions';
      }
    },
    {
      field: 'validationTimestamp',
      headerName: 'Timestamp',
      flex: 1,
      valueFormatter: (params) => 
        moment(params.value).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      field: 'actions',
      headerName: 'Details',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton onClick={() => handleViewDetails(params.row)}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const filteredLogs = auditLogs.filter(
    (log: AuditLog) => log.module === activeTab
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Validation Audit Log
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Accounts Payable" value="AP" />
          <Tab label="Accounts Receivable" value="AR" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataGrid
        rows={filteredLogs}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        sx={{ 
          '& .MuiDataGrid-cell': { fontSize: '0.9rem' },
          backgroundColor: 'background.paper' 
        }}
      />

      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedLog && (
          <>
            <DialogTitle>
              Validation Details - {selectedLog.entity}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Record ID
                </Typography>
                <Typography variant="body1">
                  {selectedLog.recordId}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Validation Result
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selectedLog.validationResult ? (
                    <>
                      <SuccessIcon color="success" />
                      <Typography color="success.main">Passed</Typography>
                    </>
                  ) : (
                    <>
                      <ErrorIcon color="error" />
                      <Typography color="error.main">Failed</Typography>
                    </>
                  )}
                </Box>
              </Box>

              {selectedLog.errors && selectedLog.errors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Validation Issues
                  </Typography>
                  {selectedLog.errors.map((error, index) => (
                    <Paper 
                      key={index} 
                      variant="outlined" 
                      sx={{ p: 2, mb: 1 }}
                    >
                      <Typography variant="subtitle2">
                        Field: {error.field}
                      </Typography>
                      <Typography variant="body2" color="error">
                        {error.message}
                      </Typography>
                      {error.legacyValue && error.convertedValue && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Data Type Conversion:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={error.legacyValue} 
                              size="small" 
                              variant="outlined" 
                            />
                            →
                            <Chip 
                              label={error.convertedValue} 
                              size="small" 
                              color="primary" 
                            />
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Timestamp
                </Typography>
                <Typography variant="body1">
                  {moment(selectedLog.validationTimestamp).format('YYYY-MM-DD HH:mm:ss')}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Created By
                </Typography>
                <Typography variant="body1">
                  {selectedLog.createdBy}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ValidationAudit;
