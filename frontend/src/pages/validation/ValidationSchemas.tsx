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
  Alert
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSchemas, updateSchema, deleteSchema } from '../../store/slices/validationSlice';

interface SchemaData {
  id: string;
  module: 'AP' | 'AR';
  entity: string;
  schemaDefinition: object;
  active: boolean;
  updatedAt: string;
}

const ValidationSchemas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AP' | 'AR'>('AP');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<SchemaData | null>(null);
  const dispatch = useDispatch();
  const { schemas, loading, error } = useSelector((state: any) => state.validation);

  useEffect(() => {
    dispatch(fetchSchemas());
  }, [dispatch]);

  const columns: GridColDef[] = [
    { field: 'entity', headerName: 'Entity', flex: 1 },
    {
      field: 'schemaDefinition',
      headerName: 'Fields',
      flex: 2,
      renderCell: (params) => {
        const fields = Object.keys(params.value.properties || {});
        return fields.join(', ');
      }
    },
    {
      field: 'dataTypes',
      headerName: 'Data Types',
      flex: 2,
      renderCell: (params) => {
        const types = Object.entries(params.row.schemaDefinition.properties || {}).map(
          ([field, def]: [string, any]) => {
            // Convert legacy types to modern PostgreSQL types
            const type = def.format === 'varchar' ? 'VARCHAR' :
                        def.format === 'decimal14_3' ? 'DECIMAL(14,3)' :
                        def.format === 'timestamp_tz' ? 'TIMESTAMP WITH TIME ZONE' :
                        def.type.toUpperCase();
            return `${field}: ${type}`;
          }
        );
        return types.join(', ');
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

  const filteredSchemas = schemas.filter(
    (schema: SchemaData) => schema.module === activeTab
  );

  const handleEdit = (schema: SchemaData) => {
    setSelectedSchema(schema);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this schema?')) {
      dispatch(deleteSchema(id));
    }
  };

  const validationSchema = Yup.object().shape({
    entity: Yup.string().required('Entity name is required'),
    schemaDefinition: Yup.string()
      .required('Schema definition is required')
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
      entity: selectedSchema?.entity || '',
      schemaDefinition: selectedSchema ? 
        JSON.stringify(selectedSchema.schemaDefinition, null, 2) : ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const updatedSchema = {
          ...selectedSchema,
          entity: values.entity,
          schemaDefinition: JSON.parse(values.schemaDefinition)
        };
        await dispatch(updateSchema(updatedSchema));
        setEditDialogOpen(false);
      } catch (error) {
        console.error('Error updating schema:', error);
      }
    }
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Validation Schemas
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
        rows={filteredSchemas}
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
            Edit Validation Schema
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              label="Entity Name"
              name="entity"
              value={formik.values.entity}
              onChange={formik.handleChange}
              error={formik.touched.entity && Boolean(formik.errors.entity)}
              helperText={formik.touched.entity && formik.errors.entity}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Schema Definition"
              name="schemaDefinition"
              value={formik.values.schemaDefinition}
              onChange={formik.handleChange}
              error={formik.touched.schemaDefinition && Boolean(formik.errors.schemaDefinition)}
              helperText={formik.touched.schemaDefinition && formik.errors.schemaDefinition}
              multiline
              rows={15}
              sx={{ mb: 2, fontFamily: 'monospace' }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Save Changes
              </Button>
            </Box>
          </form>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ValidationSchemas;
