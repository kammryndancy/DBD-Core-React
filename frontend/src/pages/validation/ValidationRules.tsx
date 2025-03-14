import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRules, updateRule, deleteRule } from '../../store/slices/validationSlice';

interface ValidationRule {
  id: string;
  module: 'AP' | 'AR';
  entity: string;
  ruleName: string;
  ruleType: 'format' | 'range' | 'required' | 'custom';
  ruleDefinition: {
    legacyType?: string;
    modernType?: string;
    validation?: object;
  };
  active: boolean;
}

const dataTypeMap = {
  CHAR: 'VARCHAR',
  NUMBER: 'DECIMAL',
  DATE: 'TIMESTAMP WITH TIME ZONE'
};

const ValidationRules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AP' | 'AR'>('AP');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ValidationRule | null>(null);
  const dispatch = useDispatch();
  const { rules, loading, error } = useSelector((state: any) => state.validation);

  useEffect(() => {
    dispatch(fetchRules());
  }, [dispatch]);

  const columns: GridColDef[] = [
    { field: 'entity', headerName: 'Entity', flex: 1 },
    { field: 'ruleName', headerName: 'Rule Name', flex: 1 },
    { 
      field: 'ruleType', 
      headerName: 'Rule Type', 
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={params.value.toUpperCase()} 
          color={
            params.value === 'format' ? 'primary' :
            params.value === 'range' ? 'secondary' :
            params.value === 'required' ? 'success' : 'default'
          }
          size="small"
        />
      )
    },
    {
      field: 'dataTypes',
      headerName: 'Data Type Migration',
      flex: 2,
      renderCell: (params) => {
        const def = params.row.ruleDefinition;
        if (def.legacyType && def.modernType) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={def.legacyType} size="small" variant="outlined" />
              →
              <Chip label={def.modernType} size="small" color="primary" />
            </Box>
          );
        }
        return null;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const filteredRules = rules.filter(
    (rule: ValidationRule) => rule.module === activeTab
  );

  const handleEdit = (rule: ValidationRule) => {
    setSelectedRule(rule);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      dispatch(deleteRule(id));
    }
  };

  const validationSchema = Yup.object().shape({
    entity: Yup.string().required('Entity is required'),
    ruleName: Yup.string().required('Rule name is required'),
    ruleType: Yup.string().required('Rule type is required'),
    legacyType: Yup.string().when('ruleType', {
      is: 'format',
      then: () => Yup.string().required('Legacy type is required')
    }),
    modernType: Yup.string().when('ruleType', {
      is: 'format',
      then: () => Yup.string().required('Modern type is required')
    }),
    validation: Yup.string()
      .required('Validation definition is required')
      .test('is-valid-json', 'Invalid JSON format', (value) => {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      })
  });

  const formik = useFormik({
    initialValues: {
      entity: selectedRule?.entity || '',
      ruleName: selectedRule?.ruleName || '',
      ruleType: selectedRule?.ruleType || 'format',
      legacyType: selectedRule?.ruleDefinition.legacyType || '',
      modernType: selectedRule?.ruleDefinition.modernType || '',
      validation: selectedRule ? 
        JSON.stringify(selectedRule.ruleDefinition.validation || {}, null, 2) : '{}'
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const updatedRule = {
          ...selectedRule,
          entity: values.entity,
          ruleName: values.ruleName,
          ruleType: values.ruleType,
          ruleDefinition: {
            legacyType: values.legacyType,
            modernType: values.modernType,
            validation: JSON.parse(values.validation)
          }
        };
        await dispatch(updateRule(updatedRule));
        setEditDialogOpen(false);
      } catch (error) {
        console.error('Error updating rule:', error);
      }
    }
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Validation Rules
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

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedRule(null);
            setEditDialogOpen(true);
          }}
        >
          Add New Rule
        </Button>
      </Box>

      <DataGrid
        rows={filteredRules}
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
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {selectedRule ? 'Edit Validation Rule' : 'New Validation Rule'}
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              label="Entity"
              name="entity"
              value={formik.values.entity}
              onChange={formik.handleChange}
              error={formik.touched.entity && Boolean(formik.errors.entity)}
              helperText={formik.touched.entity && formik.errors.entity}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Rule Name"
              name="ruleName"
              value={formik.values.ruleName}
              onChange={formik.handleChange}
              error={formik.touched.ruleName && Boolean(formik.errors.ruleName)}
              helperText={formik.touched.ruleName && formik.errors.ruleName}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Rule Type</InputLabel>
              <Select
                name="ruleType"
                value={formik.values.ruleType}
                onChange={formik.handleChange}
                error={formik.touched.ruleType && Boolean(formik.errors.ruleType)}
              >
                <MenuItem value="format">Format (Data Type)</MenuItem>
                <MenuItem value="range">Range</MenuItem>
                <MenuItem value="required">Required Fields</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            {formik.values.ruleType === 'format' && (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Legacy Type</InputLabel>
                  <Select
                    name="legacyType"
                    value={formik.values.legacyType}
                    onChange={formik.handleChange}
                    error={formik.touched.legacyType && Boolean(formik.errors.legacyType)}
                  >
                    <MenuItem value="CHAR">CHAR</MenuItem>
                    <MenuItem value="NUMBER">NUMBER</MenuItem>
                    <MenuItem value="DATE">DATE</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Modern Type</InputLabel>
                  <Select
                    name="modernType"
                    value={formik.values.modernType || dataTypeMap[formik.values.legacyType as keyof typeof dataTypeMap] || ''}
                    onChange={formik.handleChange}
                    error={formik.touched.modernType && Boolean(formik.errors.modernType)}
                  >
                    <MenuItem value="VARCHAR">VARCHAR</MenuItem>
                    <MenuItem value="DECIMAL">DECIMAL(14,3)</MenuItem>
                    <MenuItem value="TIMESTAMP WITH TIME ZONE">TIMESTAMP WITH TIME ZONE</MenuItem>
                    <MenuItem value="UUID">UUID</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            <TextField
              fullWidth
              label="Validation Definition"
              name="validation"
              value={formik.values.validation}
              onChange={formik.handleChange}
              error={formik.touched.validation && Boolean(formik.errors.validation)}
              helperText={formik.touched.validation && formik.errors.validation}
              multiline
              rows={10}
              sx={{ mb: 2, fontFamily: 'monospace' }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {selectedRule ? 'Save Changes' : 'Create Rule'}
              </Button>
            </Box>
          </form>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ValidationRules;
