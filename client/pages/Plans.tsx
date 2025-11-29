import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, Typography, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Grid, Alert, CircularProgress, CardContent, CardActions,
  Stack, Divider, Tooltip, Fade, Paper, Slide, Snackbar, useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  Add, Edit, Delete, CheckCircle, Cancel, ContentCopy,
  MonetizationOn, Verified, Close, Save, Refresh
} from '@mui/icons-material';
import { api } from '../services/api';
import { CurrencyRate } from '../types';

// Transition for Dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

// --- Templates ---
const PLAN_TEMPLATES = [
  {
    name: 'Starter Plan',
    price_monthly: 15000,
    price_yearly: 150000,
    currency: 'IQD',
    features: ['Basic POS', 'Inventory Management', '1 User'],
    limits: { maxUsers: 1, maxProducts: 500, maxBranches: 1 },
    isActive: true
  },
  {
    name: 'Pro Plan',
    price_monthly: 35000,
    price_yearly: 350000,
    currency: 'IQD',
    features: ['Advanced POS', 'Inventory & Reports', '5 Users', 'Email Support'],
    limits: { maxUsers: 5, maxProducts: 5000, maxBranches: 3 },
    isActive: true
  },
  {
    name: 'Enterprise Plan',
    price_monthly: 75000,
    price_yearly: 750000,
    currency: 'IQD',
    features: ['Unlimited POS', 'Advanced Analytics', 'Unlimited Users', 'Priority Support', 'API Access'],
    limits: { maxUsers: 999, maxProducts: 99999, maxBranches: 10 },
    isActive: true
  }
];

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
      <Typography variant="subtitle2" gutterBottom color="text.secondary">{label}</Typography>
      <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item}
            onDelete={() => handleDelete(index)}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ borderRadius: 1 }}
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
          InputProps={{ sx: { borderRadius: 2 } }}
        />
        <Button variant="contained" size="small" onClick={handleAdd} sx={{ borderRadius: 2, minWidth: 40 }}><Add /></Button>
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
      <Typography variant="subtitle2" gutterBottom color="text.secondary">{label}</Typography>
      <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
        {Object.entries(items).map(([key, value]) => (
          <Chip
            key={key}
            label={`${key}: ${value}`}
            onDelete={() => handleDelete(key)}
            size="small"
            color="secondary"
            variant="outlined"
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder="Key (e.g. maxUsers)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          InputProps={{ sx: { borderRadius: 2 } }}
        />
        <TextField
          size="small"
          placeholder="Value (e.g. 5)"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          InputProps={{ sx: { borderRadius: 2 } }}
        />
        <Button variant="contained" size="small" onClick={handleAdd} sx={{ borderRadius: 2, minWidth: 40 }}><Add /></Button>
      </Stack>
    </Box>
  );
};


const Plans = () => {
  const theme = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Feedback State
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'IQD',
    features: [] as string[],
    limits: {} as Record<string, any>,
    isActive: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, currenciesRes] = await Promise.all([
        api.getPlans(),
        api.getCurrencies()
      ]);
      setPlans(plansRes);
      setCurrencies(currenciesRes);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      const msg = err.message || 'Failed to load data';
      setError(msg);
      // Check for specific DB error
      if (msg.includes('price_monthly') || msg.includes('does not exist')) {
        setError('Database Error: Missing columns. Please run "npx prisma db push" on the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (plan?: Plan) => {
    setSaveError('');
    if (plan) {
      setEditingPlan(plan);
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
        currency: currencies.length > 0 ? currencies[0].code : 'IQD',
        features: [],
        limits: {},
        isActive: true
      });
    }
    setOpenModal(true);
  };

  const handleTemplateSelect = (templateName: string) => {
    const template = PLAN_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setFormData({
        ...template,
        name: template.name,
        features: [...template.features],
        limits: { ...template.limits },
        currency: currencies.some(c => c.code === template.currency) ? template.currency : (currencies[0]?.code || 'IQD')
      });
    }
  };

  const handleClose = () => setOpenModal(false);

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError('');
    try {
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
        setSnackbar({ open: true, message: 'Plan updated successfully', severity: 'success' });
      } else {
        await api.createPlan(payload);
        setSnackbar({ open: true, message: 'Plan created successfully', severity: 'success' });
      }

      fetchData();
      handleClose();
    } catch (err: any) {
      console.error('Error saving plan', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save plan';
      setSaveError(msg);
      if (msg.includes('price_monthly') || msg.includes('does not exist')) {
        setSaveError('Database Error: Missing columns. Please run "npx prisma db push" on the server.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await api.deletePlan(id);
        fetchData();
        setSnackbar({ open: true, message: 'Plan deleted', severity: 'success' });
      } catch (err) {
        console.error('Error deleting plan', err);
        setSnackbar({ open: true, message: 'Failed to delete plan', severity: 'error' });
      }
    }
  };

  const toggleStatus = async (plan: Plan) => {
    try {
      const action = plan.isActive ? 'deactivate' : 'activate';
      await api.togglePlanStatus(plan.id, action);
      fetchData();
      setSnackbar({ open: true, message: `Plan ${action}d`, severity: 'success' });
    } catch (err) {
      console.error('Error toggling status', err);
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
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
        isActive: false
      };
      await api.createPlan(payload);
      fetchData();
      setSnackbar({ open: true, message: 'Plan duplicated', severity: 'success' });
    } catch (err) {
      console.error('Error duplicating plan', err);
      setSnackbar({ open: true, message: 'Failed to duplicate plan', severity: 'error' });
    }
  };

  // --- Preview Card Component ---
  const PreviewCard = ({ data }: { data: typeof formData }) => (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'primary.main',
        position: 'relative',
        overflow: 'visible',
        bgcolor: 'background.paper'
      }}
    >
      <Box position="absolute" top={-12} right={20} bgcolor="primary.main" color="white" px={2} py={0.5} borderRadius={10} fontSize="0.75rem" fontWeight="bold" boxShadow={2}>
        PREVIEW
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Chip label={data.currency} size="small" sx={{ fontWeight: 'bold', borderRadius: 1.5, bgcolor: 'action.hover' }} />
          <Chip
            label={data.isActive ? 'Active' : 'Inactive'}
            color={data.isActive ? 'success' : 'default'}
            size="small"
            variant={data.isActive ? 'filled' : 'outlined'}
            sx={{ borderRadius: 1.5 }}
          />
        </Box>

        <Typography variant="h5" fontWeight="800" gutterBottom>{data.name || 'Plan Name'}</Typography>

        <Box mb={3}>
          <Typography variant="h4" component="span" fontWeight="bold" color="primary.main">
            {Number(data.price_monthly).toLocaleString()}
          </Typography>
          <Typography variant="body2" component="span" color="text.secondary" ml={1}>
            / month
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5} display="block">
            {Number(data.price_yearly).toLocaleString()} / year
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <Verified fontSize="small" color="action" /> Features
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
          {data.features.length > 0 ? (
            data.features.map((f, i) => (
              <Chip key={i} label={f} size="small" sx={{ fontSize: '0.75rem', height: 24, borderRadius: 1 }} />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">No features defined</Typography>
          )}
        </Box>

        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <MonetizationOn fontSize="small" color="action" /> Limits
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {Object.keys(data.limits).length > 0 ? (
            Object.entries(data.limits).map(([k, v]) => (
              <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 24, borderRadius: 1 }} />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">No limits defined</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Subscription Plans</Typography>
          <Typography variant="body1" color="text.secondary">Manage your pricing tiers and limits</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Refresh
          </Button>
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
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

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
                        sx={{ fontWeight: 'bold', borderRadius: 1.5, bgcolor: 'action.hover' }}
                      />
                      <Chip
                        label={plan.isActive ? 'Active' : 'Inactive'}
                        color={plan.isActive ? 'success' : 'default'}
                        size="small"
                        variant={plan.isActive ? 'filled' : 'outlined'}
                        sx={{ borderRadius: 1.5 }}
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
                      <Typography variant="body2" color="text.secondary" mt={0.5} display="block">
                        {plan.price_yearly?.toLocaleString()} / year
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <Verified fontSize="small" color="action" /> Features
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                      {Object.keys(plan.features || {}).length > 0 ? (
                        Object.keys(plan.features).map((f) => (
                          <Chip key={f} label={f} size="small" sx={{ fontSize: '0.75rem', height: 24, borderRadius: 1 }} />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.disabled">No features defined</Typography>
                      )}
                    </Box>

                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <MonetizationOn fontSize="small" color="action" /> Limits
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {Object.keys(plan.limits || {}).length > 0 ? (
                        Object.entries(plan.limits).map(([k, v]) => (
                          <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 24, borderRadius: 1 }} />
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

      <Dialog
        open={openModal}
        onClose={handleClose}
        TransitionComponent={Transition}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</Typography>
          <IconButton onClick={handleClose}><Close /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={4}>
            {/* Left Column: Form */}
            <Grid item xs={12} md={7}>
              {!editingPlan && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">Quick Start with Templates</Typography>
                  <Stack direction="row" spacing={1}>
                    {PLAN_TEMPLATES.map(t => (
                      <Chip
                        key={t.name}
                        label={t.name}
                        onClick={() => handleTemplateSelect(t.name)}
                        clickable
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {saveError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{saveError}</Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Plan Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth label="Monthly Price" type="number"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth label="Yearly Price" type="number"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={formData.currency}
                      label="Currency"
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      sx={{ borderRadius: 2 }}
                    >
                      {currencies.length > 0 ? (
                        currencies.map(c => (
                          <MenuItem key={c.code} value={c.code}>{c.code} ({c.symbol})</MenuItem>
                        ))
                      ) : (
                        <MenuItem value="IQD">IQD</MenuItem>
                      )}
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
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2 }}>
                    <Box>
                      <Typography variant="subtitle2">Plan Status</Typography>
                      <Typography variant="caption" color="text.secondary">Active plans are visible to the system</Typography>
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
              </Grid>
            </Grid>

            {/* Right Column: Preview */}
            <Grid item xs={12} md={5}>
              <Box position="sticky" top={20}>
                <Typography variant="overline" color="text.secondary" gutterBottom>Live Preview</Typography>
                <PreviewCard data={formData} />
                <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem', borderRadius: 2 }}>
                  This is how the plan will appear in the admin dashboard.
                </Alert>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} variant="outlined" color="inherit" disabled={saving} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            size="large"
            sx={{ px: 4, borderRadius: 2 }}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create & Publish')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Plans;
