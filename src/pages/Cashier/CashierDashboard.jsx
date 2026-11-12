import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, CircularProgress, Card,
  CardContent, Chip, Tooltip, IconButton, Button as MuiButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, CheckCircle2, IndianRupee, Clock,
  ArrowRight, RefreshCw, Eye, Banknote, Smartphone, Globe
} from 'lucide-react';
import KpiCard from '../../components/common/KpiCard';
import DataTable from '../../components/common/DataTable';
import { getDashboardStats } from '../../api/cashierApi';
import { ROUTES } from '../../config/routes';
import PaymentDetailDialog from './PaymentDetailDialog';
import { formatDistanceToNow, format } from 'date-fns';

const PAYMENT_MODE_ICONS = {
  CASH: Banknote,
  CARD: CreditCard,
  UPI: Smartphone,
  ONLINE: Globe,
};

const PAYMENT_MODE_COLORS = {
  CASH: { bg: '#ECFDF5', color: '#065F46', border: '#86EFAC' },
  CARD: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  UPI: { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
  ONLINE: { bg: '#FFF7ED', color: '#92400E', border: '#FED7AA' },
};

export default function CashierDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingPayments: 0,
    pendingAmount: 0,
    paidToday: 0,
    revenueToday: 0,
    recentPending: [],
    recentPaid: []
  });
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await getDashboardStats();
      setStats(response.data || {});
    } catch {
      /* retain previous state on error */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleOpenPayment = (jobCard) => {
    setSelectedJobCard(jobCard);
    setDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setDialogOpen(false);
    setSelectedJobCard(null);
    fetchStats(true);
  };

  const queueColumns = [
    {
      header: 'Vehicle',
      accessor: 'vehicle',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {row.vehicle?.registrationNo || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.2 }}>
            {row.vehicle?.makeModel || '—'}
          </Typography>
        </Box>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
            {row.customer?.fullName || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
            {row.customer?.mobileNo || '—'}
          </Typography>
        </Box>
      )
    },
    {
      header: 'Job Card',
      accessor: 'jobCardNo',
      render: (row) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.825rem', color: '#475569', fontFamily: 'monospace' }}>
          {row.jobCardNo || '—'}
        </Typography>
      )
    },
    {
      header: 'Amount Due',
      accessor: 'finalAmount',
      render: (row) => (
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(row.finalAmount || 0)}
        </Typography>
      )
    },
    {
      header: 'Waiting Since',
      accessor: 'updatedAt',
      render: (row) => (
        <Chip
          label={row.updatedAt ? formatDistanceToNow(new Date(row.updatedAt), { addSuffix: true }) : '—'}
          size="small"
          sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: '0.75rem', border: '1px solid #FCD34D' }}
        />
      )
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => (
        <MuiButton
          size="small"
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPayment(row);
          }}
          sx={{
            bgcolor: '#10B981',
            '&:hover': { bgcolor: '#059669' },
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            py: 0.5,
            px: 1.75,
            textTransform: 'none',
            boxShadow: 'none'
          }}
        >
          Collect
        </MuiButton>
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const formattedRevenue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(stats.revenueToday || 0);

  const formattedPendingAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(stats.pendingAmount || 0);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
            Cashier Desk
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.875rem', mt: 0.3 }}>
            Real-time customer billing and payment settlements
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Tooltip title="Refresh Dashboard">
            <IconButton
              size="small"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                p: 1,
                color: '#475569',
                '&:hover': { bgcolor: '#F8FAFC' }
              }}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <KpiCard
            label="Pending Collection"
            value={stats.pendingPayments ?? 0}
            subtitle={stats.pendingAmount > 0 ? `${formattedPendingAmount} to collect` : 'All vehicles cleared'}
            icon={Clock}
            theme="amber"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard
            label="Settled Today"
            value={stats.paidToday ?? 0}
            subtitle="Payments completed today"
            icon={CheckCircle2}
            theme="green"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard
            label="Revenue Today"
            value={formattedRevenue}
            subtitle="Total collections today"
            icon={IndianRupee}
            theme="teal"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '12px',
              border: '1px solid #E8EEF5',
              bgcolor: '#FFFFFF',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                p: '14px 20px',
                borderBottom: '1px solid #E8EEF5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                  Ready for Delivery — Collection Queue
                </Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.75rem', mt: 0.2 }}>
                  Vehicles awaiting payment settlement before gate exit
                </Typography>
              </Box>
              <MuiButton
                size="small"
                endIcon={<ArrowRight size={14} />}
                onClick={() => navigate(ROUTES.CASHIER_PENDING_PAYMENTS)}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#2563EB' }}
              >
                View Full Queue ({stats.pendingPayments || 0})
              </MuiButton>
            </Box>

            <DataTable
              columns={queueColumns}
              data={stats.recentPending || []}
              loading={false}
              showPagination={false}
              onRowClick={handleOpenPayment}
              emptyMessage="No vehicles waiting for payment right now"
            />
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '12px',
              border: '1px solid #E8EEF5',
              bgcolor: '#FFFFFF',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box
              sx={{
                p: '14px 20px',
                borderBottom: '1px solid #E8EEF5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                  Today's Settlements
                </Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.75rem', mt: 0.2 }}>
                  Recently completed receipts
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 1.5, flex: 1 }}>
              {(stats.recentPaid || []).length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                    No payments settled today yet
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(stats.recentPaid || []).map((paid) => {
                    const mode = paid.paymentMode || 'CASH';
                    const Icon = PAYMENT_MODE_ICONS[mode] || CreditCard;
                    const style = PAYMENT_MODE_COLORS[mode] || PAYMENT_MODE_COLORS.CASH;
                    return (
                      <Box
                        key={paid.id}
                        sx={{
                          p: 1.25,
                          borderRadius: '10px',
                          border: '1px solid #F1F5F9',
                          bgcolor: '#F8FAFC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.25
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '8px',
                              bgcolor: style.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: style.color
                            }}
                          >
                            <Icon size={16} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F172A', fontFamily: 'monospace' }}>
                              {paid.vehicle?.registrationNo}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {paid.customer?.fullName} · {paid.paymentDoneAt ? format(new Date(paid.paymentDoneAt), 'hh:mm a') : 'Today'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#059669' }}>
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paid.paidAmount || paid.finalAmount || 0)}
                          </Typography>
                          <Chip
                            label={mode}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              bgcolor: style.bg,
                              color: style.color,
                              border: `1px solid ${style.border}`
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {dialogOpen && selectedJobCard && (
        <PaymentDetailDialog
          open={dialogOpen}
          jobCard={selectedJobCard}
          onClose={() => {
            setDialogOpen(false);
            setSelectedJobCard(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Box>
  );
}
