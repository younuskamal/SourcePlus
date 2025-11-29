import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Card, Typography, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Grid, Alert, CircularProgress, CardContent, CardActions,
  Stack, Divider, Tooltip, Fade, Paper, Slide, Snackbar, useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  Add, Edit, Delete, CheckCircle, Cancel, ContentCopy,
  MonetizationOn, Verified, Close, Save, Zap, LocalFireDepartment
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
  features: Record<string, any>;
  limits: Record<string, any>;
  isActive: boolean;
}

// --- Templates ---
const PLAN_TEMPLATES = [
  {
    name: 'Starter',
    price_monthly: 15000,
    price_yearly: 150000,
    currency: 'IQD',
    features: { pos: true, inventory: true },
    limits: { maxUsers: 1, maxProducts: 500, maxBranches: 1 },
    isActive: true
  },
  {
    name: 'Professional',
    price_monthly: 35000,
    price_yearly: 350000,
    currency: 'IQD',
    features: { pos: true, inventory: true, reports: true, support: true },
    limits: { maxUsers: 5, maxProducts: 5000, maxBranches: 3 },
    isActive: true
  },
  {
    name: 'Enterprise',
    price_monthly: 75000,
    price_yearly: 750000,
    currency: 'IQD',
    features: { pos: true, inventory: true, reports: true, support: true, api: true },
    limits: { maxUsers: 999, maxProducts: 99999, maxBranches: 10 },
    isActive: true
  }
];

// --- Helper Components for List Editing ---

const FeatureEditor = ({ features, onChange }: { features: Record<string, any>, onChange: (features: Record<string, any>) => void }) => {
  const [newFeature, setNewFeature] = useState('');

  const handleAdd = () => {
    if (newFeature.trim()) {
      onChange({ ...features, [newFeature.trim()]: true });
      setNewFeature('');
    }
  };

  const handleDelete = (key: string) => {
    const updated = { ...features };
    delete updated[key];
    onChange(updated);
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: 'text.secondary', fontSize: '0.9rem' }}>
        Features
      </Typography>
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
        {Object.keys(features).length > 0 ? (
          Object.keys(features).map((feature) => (
            <Chip
              key={feature}
              label={feature}
              onDelete={() => handleDelete(feature)}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ 
                borderRadius: 2, 
                fontWeight: 500,
                fontSize: '0.8rem'
              }}
            />
          ))
        ) : (
          <Typography variant="caption" color="text.disabled">No features yet</Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Add feature (e.g. POS System)"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          variant="outlined"
          InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
        />
        <Button 
          variant="contained" 
          size="small" 
          onClick={handleAdd} 
          sx={{ 
            borderRadius: 2, 
            minWidth: 44,
            px: 1.5
          }}
        >
          <Add fontSize="small" />
        </Button>
      </Stack>
    </Box>
  );
};

const LimitEditor = ({ limits, onChange }: { limits: Record<string, any>, onChange: (limits: Record<string, any>) => void }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      const val = !isNaN(Number(newValue)) ? Number(newValue) : newValue;
      onChange({ ...limits, [newKey.trim()]: val });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleDelete = (key: string) => {
    const updated = { ...limits };
    delete updated[key];
    onChange(updated);
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: 'text.secondary', fontSize: '0.9rem' }}>
        Limits
      </Typography>
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
        {Object.keys(limits).length > 0 ? (
          Object.entries(limits).map(([key, value]) => (
            <Chip
              key={key}
              label={`${key}: ${value}`}
              onDelete={() => handleDelete(key)}
              size="small"
              color="success"
              variant="outlined"
              sx={{ 
                borderRadius: 2, 
                fontWeight: 500,
                fontSize: '0.8rem',
                borderColor: 'success.light',
                color: 'success.main'
              }}
            />
          ))
        ) : (
          <Typography variant="caption" color="text.disabled">No limits set</Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={1} mb={1}>
        <TextField
          size="small"
          placeholder="Key (e.g. maxUsers)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          variant="outlined"
          InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
        />
        <TextField
          size="small"
          placeholder="Value (e.g. 5)"
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          variant="outlined"
          InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
        />
        <Button 
          variant="contained" 
          size="small" 
          onClick={handleAdd}
          sx={{ 
            borderRadius: 2, 
            minWidth: 44,
            px: 1.5
          }}
        >
          <Add fontSize="small" />
        </Button>
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
    features: {} as Record<string, any>,
    limits: {} as Record<string, any>,
    isActive: true
  });

  const getCurrencySymbol = (code: string) => {
    const currency = currencies.find(c => c.code === code);
    return currency?.symbol || code;
  };

  const formatPrice = (amount: number, currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString()}`;
  };

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
      setFormData({
        name: plan.name,
        price_monthly: plan.price_monthly || 0,
        price_yearly: plan.price_yearly || 0,
        currency: plan.currency,
        features: plan.features || {},
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
        features: {},
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
        features: { ...template.features },
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
      const payload = {
        name: formData.name,
        price_monthly: Number(formData.price_monthly),
        price_yearly: Number(formData.price_yearly),
        currency: formData.currency,
        features: formData.features,
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
      setSnackbar({ open: true, message: `Plan ${action}d successfully`, severity: 'success' });
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
      setSnackbar({ open: true, message: 'Plan duplicated successfully', severity: 'success' });
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
        borderRadius: 3,
        border: '2px solid',
        borderColor: 'primary.main',
        position: 'relative',
        overflow: 'visible',
        bgcolor: 'background.paper'
      }}
    >
      <Box position="absolute" top={-14} right={16} bgcolor="primary.main" color="white" px={2.5} py={0.75} borderRadius={2} fontSize="0.7rem" fontWeight="900" boxShadow={3} letterSpacing={1}>
        PREVIEW
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} gap={2}>
          <Chip 
            label={data.currency} 
            size="small" 
            sx={{ 
              fontWeight: 'bold', 
              borderRadius: 1.5, 
              bgcolor: 'primary.50',
              color: 'primary.main',
              fontSize: '0.75rem'
            }} 
          />
          <Chip
            label={data.isActive ? 'Active' : 'Inactive'}
            color={data.isActive ? 'success' : 'default'}
            size="small"
            variant={data.isActive ? 'filled' : 'outlined'}
            sx={{ borderRadius: 1.5 }}
          />
        </Box>

        <Typography variant="h5" fontWeight="900" gutterBottom sx={{ mb: 1, minHeight: 32 }}>
          {data.name || 'Plan Name'}
        </Typography>

        <Box mb={3} sx={{ background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)', borderRadius: 2, p: 2 }}>
          <Typography variant="h3" component="div" fontWeight="bold" color="primary.main" gutterBottom>
            {formatPrice(Number(data.price_monthly), data.currency)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            per month
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <span style={{ opacity: 0.7 }}>or {formatPrice(Number(data.price_yearly), data.currency)} annually</span>
          </Typography>
        </Box>

        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

        <Typography 
          variant="subtitle2" 
          fontWeight="bold" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            color: 'primary.main',
            mb: 2,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}
        >
          <Verified fontSize="small" /> Features
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
          {Object.keys(data.features).length > 0 ? (
            Object.keys(data.features).map((f, i) => (
              <Chip 
                key={i} 
                label={f} 
                size="small" 
                variant="outlined"
                sx={{ 
                  fontSize: '0.8rem', 
                  height: 28, 
                  borderRadius: 2,
                  borderColor: 'primary.light',
                  color: 'primary.main'
                }} 
              />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">No features defined</Typography>
          )}
        </Box>

        <Typography 
          variant="subtitle2" 
          fontWeight="bold" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            color: 'primary.main',
            mb: 2,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}
        >
          <Zap fontSize="small" /> Limits
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.keys(data.limits).length > 0 ? (
            Object.entries(data.limits).map(([k, v]) => (
              <Chip 
                key={k} 
                label={`${k}: ${v}`} 
                size="small" 
                variant="outlined"
                sx={{ 
                  fontSize: '0.8rem', 
                  height: 28, 
                  borderRadius: 2,
                  borderColor: 'success.light',
                  color: 'success.main'
                }} 
              />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">No limits defined</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ letterSpacing: -0.5 }}>
            Subscription Plans
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage subscription tiers, pricing, and features
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{ 
            borderRadius: 3, 
            px: 3, 
            py: 1.5, 
            textTransform: 'none', 
            fontSize: '1rem', 
            boxShadow: 3,
            '&:hover': { boxShadow: 4 }
          }}
        >
          Create New Plan
        </Button>
      </Box>

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Loading State */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={8}>
          <CircularProgress size={48} />
        </Box>
      ) : plans.length === 0 ? (
        /* Empty State */
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          p={8}
          sx={{ minHeight: '400px', backgroundColor: 'action.hover', borderRadius: 3 }}
        >
          <MonetizationOn sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Plans Yet
          </Typography>
          <Typography variant="body2" color="text.disabled" mb={3}>
            Create your first subscription plan to get started
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{ borderRadius: 2 }}
          >
            Create Your First Plan
          </Button>
        </Box>
      ) : (
        /* Plans Grid */
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
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
                      borderColor: plan.isActive ? 'primary.main' : 'divider'
                    }
                  }}
                >
                  {/* Ribbon for highlighted plans */}
                  {!plan.isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: -32,
                        width: 80,
                        height: 32,
                        backgroundColor: 'error.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        transform: 'rotate(45deg)',
                        zIndex: 1
                      }}
                    >
                      INACTIVE
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Top Section: Currency & Status */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} gap={2}>
                      <Chip
                        label={plan.currency}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold', 
                          borderRadius: 1.5, 
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          fontSize: '0.75rem'
                        }}
                      />
                      <Chip
                        label={plan.isActive ? 'Active' : 'Inactive'}
                        icon={plan.isActive ? <CheckCircle sx={{ fontSize: '0.9rem' }} /> : <Cancel sx={{ fontSize: '0.9rem' }} />}
                        color={plan.isActive ? 'success' : 'default'}
                        size="small"
                        variant={plan.isActive ? 'filled' : 'outlined'}
                        sx={{ 
                          borderRadius: 1.5,
                          fontSize: '0.8rem'
                        }}
                      />
                    </Box>

                    {/* Plan Name */}
                    <Typography variant="h5" fontWeight="900" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
                      {plan.name}
                    </Typography>

                    {/* Pricing Box */}
                    <Box mb={3} sx={{ 
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)', 
                      borderRadius: 2, 
                      p: 2,
                      borderLeft: '4px solid',
                      borderLeftColor: 'primary.main'
                    }}>
                      <Typography variant="h3" component="div" fontWeight="bold" color="primary.main" gutterBottom>
                        {formatPrice(plan.price_monthly, plan.currency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        monthly
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                        or {formatPrice(plan.price_yearly, plan.currency)} annually
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2.5, borderStyle: 'dashed' }} />

                    {/* Features Section */}
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="bold" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        color: 'primary.main',
                        mb: 1.5,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}
                    >
                      <Verified fontSize="small" /> Features
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2.5}>
                      {Object.keys(plan.features || {}).length > 0 ? (
                        Object.keys(plan.features).map((f) => (
                          <Chip 
                            key={f} 
                            label={f} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.75rem', 
                              height: 26, 
                              borderRadius: 2,
                              borderColor: 'primary.light',
                              color: 'primary.main',
                              fontWeight: 500
                            }} 
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </Box>

                    {/* Limits Section */}
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="bold" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        color: 'success.main',
                        mb: 1.5,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}
                    >
                      <LocalFireDepartment fontSize="small" /> Limits
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {Object.keys(plan.limits || {}).length > 0 ? (
                        Object.entries(plan.limits).map(([k, v]) => (
                          <Chip 
                            key={k} 
                            label={`${k}: ${v}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.75rem', 
                              height: 26, 
                              borderRadius: 2,
                              borderColor: 'success.light',
                              color: 'success.main',
                              fontWeight: 500
                            }} 
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </Box>
                  </CardContent>

                  {/* Action Buttons */}
                  <CardActions sx={{ p: 3, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title={plan.isActive ? "Deactivate" : "Activate"} arrow>
                      <IconButton
                        size="small"
                        onClick={() => toggleStatus(plan)}
                        sx={{ 
                          bgcolor: plan.isActive ? 'warning.100' : 'success.100',
                          color: plan.isActive ? 'warning.main' : 'success.main',
                          '&:hover': { 
                            bgcolor: plan.isActive ? 'warning.200' : 'success.200'
                          }
                        }}
                      >
                        {plan.isActive ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate Plan" arrow>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDuplicate(plan)} 
                        sx={{ 
                          bgcolor: 'action.hover',
                          color: 'text.secondary',
                          '&:hover': { 
                            bgcolor: 'action.selected',
                            color: 'primary.main'
                          }
                        }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Plan" arrow>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpen(plan)} 
                        sx={{ 
                          bgcolor: 'primary.100',
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.200' }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Plan" arrow>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(plan.id)} 
                        sx={{ 
                          bgcolor: 'error.100',
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.200' }
                        }}
                      >
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

      {/* Modal Dialog */}
      <Dialog
        open={openModal}
        onClose={handleClose}
        TransitionComponent={Transition}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 3,
            backgroundImage: 'none'
          } 
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          pb: 2,
          pt: 3,
          px: 3
        }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {editingPlan ? '✏️ Edit Plan' : '➕ Create New Plan'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {editingPlan ? 'Update plan details and pricing' : 'Set up a new subscription tier'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {saveError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{saveError}</Alert>
          )}

          <Grid container spacing={3}>
            {/* Left Column: Form */}
            <Grid item xs={12} md={7}>
              {!editingPlan && (
                <Box mb={3} sx={{ p: 2.5, backgroundColor: 'action.hover', borderRadius: 2, borderLeft: '4px solid primary.main' }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontSize: '0.9rem' }}>
                    <Zap fontSize="small" /> Quick Start with Templates
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {PLAN_TEMPLATES.map(t => (
                      <Chip
                        key={t.name}
                        label={t.name}
                        onClick={() => handleTemplateSelect(t.name)}
                        clickable
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          borderRadius: 2,
                          fontSize: '0.85rem',
                          '&:hover': {
                            backgroundColor: 'primary.50'
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Grid container spacing={2}>
                {/* Plan Name */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.9rem' }}>
                    Plan Name *
                  </Typography>
                  <TextField
                    fullWidth 
                    placeholder="e.g., Professional Plan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    variant="outlined"
                    size="small"
                    error={!formData.name && saving}
                    InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
                  />
                </Grid>

                {/* Pricing */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: 'text.secondary', fontSize: '0.9rem' }}>
                    Pricing
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth 
                        label="Monthly Price" 
                        type="number"
                        placeholder="10000"
                        value={formData.price_monthly}
                        onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                        size="small"
                        InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth 
                        label="Yearly Price" 
                        type="number"
                        placeholder="100000"
                        value={formData.price_yearly}
                        onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
                        size="small"
                        InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Currency Selector */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.9rem' }}>
                    Currency *
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      sx={{ borderRadius: 2, fontSize: '0.9rem' }}
                    >
                      {currencies.length > 0 ? (
                        currencies.map(c => (
                          <MenuItem key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="IQD">د.ع IQD</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Features Editor */}
                <Grid item xs={12}>
                  <FeatureEditor
                    features={formData.features}
                    onChange={(features) => setFormData({ ...formData, features })}
                  />
                </Grid>

                {/* Limits Editor */}
                <Grid item xs={12}>
                  <LimitEditor
                    limits={formData.limits}
                    onChange={(limits) => setFormData({ ...formData, limits })}
                  />
                </Grid>

                {/* Status Toggle */}
                <Grid item xs={12}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2.5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      borderRadius: 2,
                      backgroundColor: formData.isActive ? 'success.50' : 'error.50',
                      borderColor: formData.isActive ? 'success.light' : 'error.light',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.95rem' }}>
                        Plan Status
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formData.isActive ? '✓ Active and available' : '○ Hidden from customers'}
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          color="success"
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* Right Column: Preview */}
            <Grid item xs={12} md={5}>
              <Box position="sticky" top={20}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.9rem' }}>
                  👁️ Live Preview
                </Typography>
                <PreviewCard data={formData} />
                <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem', borderRadius: 2 }}>
                  Preview updates in real-time as you make changes.
                </Alert>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined" 
            color="inherit" 
            disabled={saving} 
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            size="large"
            sx={{ px: 4, borderRadius: 2, textTransform: 'none' }}
            disabled={saving || !formData.name || !formData.currency}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          >
            {saving ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Plans;
