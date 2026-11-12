import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import { ArrowLeft, LogIn, LogOut, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime } from '../../utils/formatters';
import styles from './GateEntry.module.css';
import { gateEntryApi } from '../../api/gateEntryApi';
import { toastSuccess, toastError } from '../../notifications/toast';

export default function GateEntryDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingExit, setSubmittingExit] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await gateEntryApi.getBySlug(slug);
      setVehicle(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchData();
  }, [slug]);

  const handleConfirmExit = async () => {
    if (!vehicle) return;
    try {
      setSubmittingExit(true);
      await gateEntryApi.submitExit(vehicle.id, { remarks: 'Exit registered from web pass details' });
      toastSuccess(`Vehicle ${vehicle.vehicleNumber} exit recorded successfully!`);
      await fetchData();
    } catch (err) {
      toastError(err?.message || 'Failed to record exit. Please ensure payment is recorded by cashier.');
    } finally {
      setSubmittingExit(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!vehicle) return <Box sx={{ p: 4 }}><Typography>Gate entry not found.</Typography></Box>;
  if (!vehicle) return null;

  return (
    <Box sx={{ bgcolor: 'background.paper', minHeight: 'auto', p: { xs: 2, md: '19px' }, m: '30px', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          Vehicle Pass Details
        </Typography>
        <Box
          component="button"
          onClick={() => navigate('/gate-entry')}
          className="back-btn"
        >
          <ArrowLeft size={16} /> Back to List
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Vehicle Section */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 2, borderBottom: '1.5px solid', borderColor: 'divider', pb: 0.5 }}>
            Vehicle Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Vehicle Number</Typography>
              <Box sx={{ mt: 0.5 }}><code className={styles.vehicleNum}>{vehicle.vehicleNumber}</code></Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Make & Model</Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>{vehicle.makeModel}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Status</Typography>
              <Box sx={{ mt: 0.5 }}><StatusBadge status={vehicle.status} /></Box>
            </Grid>
          </Grid>
        </Box>

        {/* Owner Section */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 2, borderBottom: '1.5px solid', borderColor: 'divider', pb: 0.5 }}>
            Owner Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Owner Name</Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>{vehicle.ownerName}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Mobile Number</Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>{vehicle.mobile}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Email</Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>{vehicle.email || '—'}</Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Remarks Section */}
        {vehicle.remarks && (
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 2, borderBottom: '1.5px solid', borderColor: 'divider', pb: 0.5 }}>
              Remarks
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-line', color: 'text.primary' }}>
              {vehicle.remarks}
            </Typography>
          </Box>
        )}

        {/* Payment & Exit Clearance */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 2, borderBottom: '1.5px solid', borderColor: 'divider', pb: 0.5 }}>
            Payment & Exit Clearance
          </Typography>
          {vehicle.paymentStatus === 'PAYMENT_PENDING' ? (
            <Box sx={{ p: 2.5, bgcolor: '#FFFBEB', borderRadius: 2, border: '1.5px solid #FDE68A', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ p: 1, bgcolor: '#FEF3C7', borderRadius: '8px', color: '#D97706', display: 'flex' }}>
                <AlertTriangle size={24} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#92400E">
                  Payment Pending — Exit Blocked
                </Typography>
                <Typography variant="body2" color="#78350F" sx={{ mt: 0.5 }}>
                  Vehicle exit is locked. The customer must pay and the Cashier must mark the job card as paid before gate exit can be confirmed.
                </Typography>
              </Box>
            </Box>
          ) : vehicle.paymentStatus === 'PAYMENT_DONE' ? (
            <Box sx={{ p: 2.5, bgcolor: '#ECFDF5', borderRadius: 2, border: '1.5px solid #A7F3D0', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ p: 1, bgcolor: '#DCFCE7', borderRadius: '8px', color: '#16A34A', display: 'flex' }}>
                <CheckCircle2 size={24} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#065F46">
                  Payment Completed — Cleared for Exit
                </Typography>
                <Typography variant="body2" color="#047857" sx={{ mt: 0.5 }}>
                  Customer payment has been recorded by Cashier. Vehicle is authorized for security gate exit.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1.5px solid #E2E8F0' }}>
              <Typography variant="body2" color="text.secondary">
                Non-billable or enquiry visit. Standard exit procedures apply.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Operations Logs Section */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 2, borderBottom: '1.5px solid', borderColor: 'divider', pb: 0.5 }}>
            Entry & Exit Timeline
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1.5px solid', borderColor: 'success.100' }}>
                <Typography variant="subtitle2" fontWeight={700} color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LogIn size={16} /> Entry Logged
                </Typography>
                <Typography variant="body2" color="success.main">
                  <strong>Time:</strong> {formatDateTime(vehicle.entryTime)}
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                  <strong>By:</strong> {vehicle.entryBy}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              {vehicle.status === 'EXITED' || vehicle.status === 'CLOSED' || vehicle.exitTime ? (
                <Box sx={{ p: 2, bgcolor: 'error.50', borderRadius: 2, border: '1.5px solid', borderColor: 'error.100' }}>
                  <Typography variant="subtitle2" fontWeight={700} color="error.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LogOut size={16} /> Exit Logged
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    <strong>Time:</strong> {vehicle.exitTime ? formatDateTime(vehicle.exitTime) : '—'}
                  </Typography>
                  <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                    <strong>By:</strong> System
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2.5, bgcolor: vehicle.canExit ? '#F0FDF4' : '#FFFBEB', borderRadius: 2, border: '1.5px solid', borderColor: vehicle.canExit ? '#BBF7D0' : '#FDE68A', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color={vehicle.canExit ? 'success.dark' : 'warning.dark'} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Clock size={16} /> {vehicle.canExit ? 'Ready for Exit' : 'Exit Blocked'}
                    </Typography>
                    <Typography variant="body2" color={vehicle.canExit ? 'success.dark' : 'warning.dark'} sx={{ mt: 0.5 }}>
                      {vehicle.canExit
                        ? 'Vehicle is cleared to exit the premises.'
                        : 'Vehicle cannot exit until customer completes payment with cashier.'}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="primary"
                      disabled={!vehicle.canExit || submittingExit}
                      onClick={handleConfirmExit}
                    >
                      {submittingExit ? 'Processing Exit...' : 'Confirm Vehicle Exit'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
