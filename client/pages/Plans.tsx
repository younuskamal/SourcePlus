import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, IconButton, Chip, Modal,
  TextField, FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Grid, Paper, Alert, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Refresh, CheckCircle, Cancel } from '@mui/icons-material';
import { api } from '../services/api';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: any;
  limits: any;
  isActive: boolean;
}

const Plans = ({ currentLang }: { currentLang: string }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'IQD',
    features: '{}',
    limits: '{}',
    isActive: true
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await api.getPlans();
      setPlans(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch plans', err);
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    const interval = setInterval(fetchPlans, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price_monthly: plan.price_monthly || 0,
        price_yearly: plan.price_yearly || 0,
        currency: plan.currency,
        features: JSON.stringify(plan.features || {}, null, 2),
        limits: JSON.stringify(plan.limits || {}, null, 2),
        isActive: plan.isActive
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        currency: 'IQD',
        features: '{\n  "pos": true,\n  "inventory": true\n}',
        limits: '{\n  "maxUsers": 5,\n  "maxProducts": 1000\n}',
        isActive: true
      });
    }
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        price_monthly: Number(formData.price_monthly),
        price_yearly: Number(formData.price_yearly),
        features: JSON.parse(formData.features),
        limits: JSON.parse(formData.limits)
      };

      if (editingPlan) {
        await api.updatePlan(editingPlan.id, payload);
      } else {
        await api.createPlan(payload);
      }

      fetchPlans();
      handleClose();
    } catch (err) {
      console.error('Error saving plan', err);
      alert('Failed to save plan. Check JSON format.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await api.deletePlan(id);
        fetchPlans();
      } catch (err) {
        console.error('Error deleting plan', err);
        alert('Failed to delete plan');
      }
    }
  };

  const toggleStatus = async (plan: Plan) => {
    try {
      const action = plan.isActive ? 'deactivate' : 'activate';
      await api.togglePlanStatus(plan.id, action);
      fetchPlans();
    } catch (err) {
      console.error('Error toggling status', err);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Subscription Plans</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Create New Plan
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Monthly Price</TableCell>
              <TableCell>Yearly Price</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
              </TableRow>
            ) : plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.name}</TableCell>
                <TableCell>{plan.price_monthly?.toLocaleString()}</TableCell>
                <TableCell>{plan.price_yearly?.toLocaleString()}</TableCell>
                <TableCell>{plan.currency}</TableCell>
                <TableCell>
                  <Chip
                    label={plan.isActive ? 'Active' : 'Inactive'}
                    color={plan.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(plan)} color="primary"><Edit /></IconButton>
                  <IconButton onClick={() => toggleStatus(plan)} color={plan.isActive ? 'warning' : 'success'}>
                    {plan.isActive ? <Cancel /> : <CheckCircle />}
                  </IconButton>
                  <IconButton onClick={() => handleDelete(plan.id)} color="error"><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={openModal} onClose={handleClose}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2
        }}>
          <Typography variant="h6" mb={2}>{editingPlan ? 'Edit Plan' : 'Create Plan'}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth label="Monthly Price" type="number"
                value={formData.price_monthly}
                onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth label="Yearly Price" type="number"
                value={formData.price_yearly}
                onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  label="Currency"
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <MenuItem value="IQD">IQD</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Features (JSON)" multiline rows={4}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                helperText="Enter valid JSON object"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Limits (JSON)" multiline rows={4}
                value={formData.limits}
                onChange={(e) => setFormData({ ...formData, limits: e.target.value })}
                helperText="Enter valid JSON object"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit}>Save</Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </Box>
  );
};

export default Plans;
