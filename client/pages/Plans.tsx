import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Typography, IconButton, Chip, Modal,
  TextField, FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Grid, Alert, CircularProgress, CardContent, CardActions,
  Stack, Divider, Tooltip, Fade
} from '@mui/material';
import {
  Add, Edit, Delete, CheckCircle, Cancel, ContentCopy,
  MonetizationOn, Verified, Close
} from '@mui/icons-material';
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

// --- Helper Components for List Editing ---

const ListEditor = ({ label, items, onChange, placeholder }: { label: string, items: string[], onChange: (items: string[]) => void, placeholder: string }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleDelete = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item}
            onDelete={() => handleDelete(index)}
            size="small"
            color="primary"
            variant="outlined"
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="contained" size="small" onClick={handleAdd}><Add /></Button>
      </Stack>
    </Box>
  );
};

const KeyValueEditor = ({ label, items, onChange }: { label: string, items: Record<string, any>, onChange: (items: Record<string, any>) => void }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey.trim()) {
      const val = !isNaN(Number(newValue)) && newValue !== '' ? Number(newValue) : newValue;
      onChange({ ...items, [newKey.trim()]: val });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleDelete = (key: string) => {
    const newItems = { ...items };
    delete newItems[key];
    onChange(newItems);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
        {Object.entries(items).map(([key, value]) => (
          <Chip
            key={key}
            label={`${key}: ${value}`}
            onDelete={() => handleDelete(key)}
            size="small"
            color="secondary"
            variant="outlined"
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder="Key (e.g. maxUsers)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <TextField
          size="small"
          placeholder="Value (e.g. 5)"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="contained" size="small" onClick={handleAdd}><Add /></Button>
      </Stack>
    </Box>
  );
};


const Plans = () => {
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
    features: [] as string[], // Simplified to array of strings for UI
    limits: {} as Record<string, any>,
    isActive: true
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.getPlans();
      setPlans(response);
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
  }, []);

  const handleOpen = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      // Convert features object to array if needed, or handle as is. 
      // Assuming features is stored as { "pos": true, "inventory": true } or ["pos", "inventory"]
      // The user requested "Features list (auto-format JSON -> readable list)"
      // Let's assume features is an array of strings or object keys with true values.
      let featuresList: string[] = [];
      if (Array.isArray(plan.features)) {
        featuresList = plan.features;
      } else if (typeof plan.features === 'object') {
        featuresList = Object.keys(plan.features).filter(k => plan.features[k]);
      }

      setFormData({
        name: plan.name,
        price_monthly: plan.price_monthly || 0,
        price_yearly: plan.price_yearly || 0,
        currency: plan.currency,
        features: featuresList,
        limits: plan.limits || {},
        isActive: plan.isActive
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        currency: 'IQD',
        features: [],
        limits: {},
        isActive: true
      });
    }
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

  const handleSubmit = async () => {
    try {
      // Convert features array back to object if backend expects object, or keep as array.
      // User prompt: "features: { "pos": true, "inventory": true }"
      const featuresObj = formData.features.reduce((acc, curr) => ({ ...acc, [curr]: true }), {});

      const payload = {
        name: formData.name,
        price_monthly: Number(formData.price_monthly),
        price_yearly: Number(formData.price_yearly),
        currency: formData.currency,
        features: featuresObj,
        limits: formData.limits,
        isActive: formData.isActive
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
      alert('Failed to save plan.');
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

  const handleDuplicate = async (plan: Plan) => {
    try {
      const payload = {
        name: `${plan.name} (Copy)`,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        currency: plan.currency,
        features: plan.features,
        limits: plan.limits,
        isActive: false // Default to inactive for copy
      };
      await api.createPlan(payload);
      fetchPlans();
    } catch (err) {
      console.error('Error duplicating plan', err);
      alert('Failed to duplicate plan');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Subscription Plans</Typography>
          <Typography variant="body1" color="text.secondary">Manage your pricing tiers and limits</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2, px: 3, py: 1.5, textTransform: 'none', fontSize: '1rem', boxShadow: 2 }}
        >
          Create New Plan
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} sm={6} lg={4} key={plan.id}>
              <Fade in timeout={500}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Chip
                        label={plan.currency}
                        size="small"
                        sx={{ fontWeight: 'bold', borderRadius: 1, bgcolor: 'action.hover' }}
                      />
                      <Chip
                        label={plan.isActive ? 'Active' : 'Inactive'}
                        color={plan.isActive ? 'success' : 'default'}
                        size="small"
                        variant={plan.isActive ? 'filled' : 'outlined'}
                      />
                    </Box>

                    <Typography variant="h5" fontWeight="800" gutterBottom>{plan.name}</Typography>

                    <Box mb={3}>
                      <Typography variant="h4" component="span" fontWeight="bold" color="primary.main">
                        {plan.price_monthly?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" component="span" color="text.secondary" ml={1}>
                        / month
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        {plan.price_yearly?.toLocaleString()} / year
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Verified fontSize="small" color="action" /> Features
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                      {Object.keys(plan.features || {}).length > 0 ? (
                        Object.keys(plan.features).map((f) => (
                          <Chip key={f} label={f} size="small" sx={{ fontSize: '0.75rem', height: 24 }} />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.disabled">No features defined</Typography>
                      )}
                    </Box>

                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MonetizationOn fontSize="small" color="action" /> Limits
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {Object.keys(plan.limits || {}).length > 0 ? (
                        Object.entries(plan.limits).map(([k, v]) => (
                          <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 24 }} />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.disabled">No limits defined</Typography>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Toggle Status">
                      <IconButton
                        size="small"
                        onClick={() => toggleStatus(plan)}
                        color={plan.isActive ? 'warning' : 'success'}
                        sx={{ bgcolor: plan.isActive ? 'warning.light' : 'success.light', color: 'white', '&:hover': { bgcolor: plan.isActive ? 'warning.main' : 'success.main' } }}
                      >
                        {plan.isActive ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={() => handleDuplicate(plan)} sx={{ bgcolor: 'action.hover' }}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpen(plan)} color="primary" sx={{ bgcolor: 'primary.50' }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(plan.id)} color="error" sx={{ bgcolor: 'error.50' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      <Modal open={openModal} onClose={handleClose}>
        <Fade in={openModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600 }, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 3,
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</Typography>
              <IconButton onClick={handleClose}><Close /></IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Plan Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Monthly Price" type="number"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Yearly Price" type="number"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    label="Currency"
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <MenuItem value="IQD">IQD</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>Features & Limits</Divider>
              </Grid>

              <Grid item xs={12}>
                <ListEditor
                  label="Features"
                  items={formData.features}
                  onChange={(items) => setFormData({ ...formData, features: items })}
                  placeholder="Add feature (e.g. POS)"
                />
              </Grid>
              <Grid item xs={12}>
                <KeyValueEditor
                  label="Limits"
                  items={formData.limits}
                  onChange={(items) => setFormData({ ...formData, limits: items })}
                />
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2">Plan Status</Typography>
                    <Typography variant="caption" color="text.secondary">Inactive plans are hidden from clients</Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        color="success"
                      />
                    }
                    label={formData.isActive ? "Active" : "Inactive"}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={2}>
                <Button onClick={handleClose} variant="outlined" color="inherit">Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} size="large" sx={{ px: 4 }}>
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default Plans;
