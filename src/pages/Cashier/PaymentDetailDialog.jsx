import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Divider, Grid, Chip,
  ToggleButton, ToggleButtonGroup, CircularProgress, Alert
} from '@mui/material';
import { CreditCard, Banknote, Smartphone, Globe, CheckCircle2, X } from 'lucide-react';
import Button from '../../components/common/Button';
import { markAsPaid } from '../../api/cashierApi';

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'ONLINE', label: 'Online', icon: Globe },
];

const AmountRow = ({ label, value, bold, color }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
    <Typography sx={{ fontSize: '0.875rem', color: color || '#64748B', fontWeight: bold ? 700 : 400 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: bold ? '1rem' : '0.875rem', fontWeight: bold ? 800 : 500, color: color || '#0F172A' }}>
      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0)}
    </Typography>
  </Box>
);

export default function PaymentDetailDialog({ open, jobCard, onClose, onSuccess }) {
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMarkPaid = async () => {
    setError('');
    setLoading(true);
    try {
      await markAsPaid(jobCard.id, { paymentMode, paidAmount: jobCard.finalAmount });
      onSuccess();
    } catch (err) {
      setError(err?.message || 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ bgcolor: '#0F172A', p: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
              Process Payment
            </Typography>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', mt: 0.3 }}>
              {jobCard.vehicle?.registrationNo} · {jobCard.jobCardNo}
            </Typography>
          </Box>
          <Box
            onClick={loading ? undefined : onClose}
            sx={{ cursor: 'pointer', color: '#94A3B8', '&:hover': { color: '#fff' }, transition: 'color 0.15s' }}
          >
            <X size={20} />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: '24px' }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', mb: 0.5 }}>
            {jobCard.customer?.fullName}
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
            {jobCard.customer?.mobileNo} · {jobCard.vehicle?.makeModel}
          </Typography>
        </Box>

        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E8EEF5', p: 2, mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
            Bill Summary
          </Typography>
          <AmountRow label="Service Subtotal" value={jobCard.serviceSubtotal || jobCard.totalEstimate} />
          {jobCard.discountAmount > 0 && (
            <AmountRow label="Discount" value={-jobCard.discountAmount} color="#059669" />
          )}
          {jobCard.taxAmount > 0 && (
            <AmountRow label={`Tax (${jobCard.taxRate || 0}%)`} value={jobCard.taxAmount} />
          )}
          <Divider sx={{ my: 1.5 }} />
          <AmountRow label="Total Amount Due" value={jobCard.finalAmount} bold color="#0F172A" />
        </Box>

        {jobCard.services?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', mb: 1.5 }}>
              Services ({jobCard.services.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {jobCard.services.map((s) => (
                <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.825rem', color: '#475569' }}>
                      {s.serviceName}{s.quantity > 1 ? ` ×${s.quantity}` : ''}
                    </Typography>
                    {s.isAdditional && (
                      <Chip label="Add-on" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#F3E8FF', color: '#7C3AED', fontWeight: 700 }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.825rem', fontWeight: 600, color: '#0F172A' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((s.price * s.quantity) || 0)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', mb: 1.5 }}>
            Payment Mode
          </Typography>
          <ToggleButtonGroup
            value={paymentMode}
            exclusive
            onChange={(_, val) => { if (val) setPaymentMode(val); }}
            sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
          >
            {PAYMENT_MODES.map(({ value, label, icon: Icon }) => (
              <ToggleButton
                key={value}
                value={value}
                sx={{
                  flex: 1,
                  minWidth: 90,
                  borderRadius: '10px !important',
                  border: '1px solid #E2E8F0 !important',
                  py: 1.25,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#64748B',
                  '&.Mui-selected': {
                    bgcolor: '#EFF6FF !important',
                    borderColor: '#2563EB !important',
                    color: '#2563EB'
                  },
                  '&:hover': { bgcolor: '#F8FAFC' }
                }}
              >
                <Icon size={18} />
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid #E8EEF5', gap: 1.5 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading} sx={{ flex: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleMarkPaid}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={16} />}
          sx={{
            flex: 2,
            bgcolor: '#10B981',
            '&:hover': { bgcolor: '#059669' },
            fontWeight: 700
          }}
        >
          {loading ? 'Processing...' : `Mark as Paid · ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(jobCard.finalAmount || 0)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
