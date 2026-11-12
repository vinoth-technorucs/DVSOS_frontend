import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, InputAdornment,
  Chip, Tooltip, IconButton, CircularProgress
} from '@mui/material';
import { Search, Eye } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import { getPendingPayments } from '../../api/cashierApi';
import PaymentDetailDialog from './PaymentDetailDialog';
import { formatDistanceToNow } from 'date-fns';

export default function PendingPaymentsList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(15);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPendingPayments({ search: debouncedSearch, page: page + 1, limit });
      setRows(response.data || []);
      setTotal(response.meta?.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenPayment = (jobCard) => {
    setSelectedJobCard(jobCard);
    setDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setDialogOpen(false);
    setSelectedJobCard(null);
    fetchData();
  };

  const columns = [
    {
      header: 'Vehicle',
      accessor: 'vehicle',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {row.vehicle?.registrationNo || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.3 }}>
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
        <Tooltip title="Process Payment">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleOpenPayment(row); }}
            sx={{
              bgcolor: '#EFF6FF',
              color: '#2563EB',
              '&:hover': { bgcolor: '#DBEAFE' },
              borderRadius: '8px',
              p: 0.75
            }}
          >
            <Eye size={16} />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.25rem' }}>
            Pending Payments
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.875rem', mt: 0.3 }}>
            {loading ? '...' : `${total} vehicle${total !== 1 ? 's' : ''} awaiting payment`}
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search vehicle, customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={16} color="#94A3B8" /></InputAdornment>
          }}
          sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC' } }}
        />
      </Box>

      {loading && rows.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          serverSide
          totalCount={total}
          page={page}
          rowsPerPage={limit}
          onPageChange={setPage}
          onRowClick={handleOpenPayment}
          emptyMessage="No vehicles are awaiting payment"
          rowsPerPageOptions={[15]}
        />
      )}

      {dialogOpen && selectedJobCard && (
        <PaymentDetailDialog
          open={dialogOpen}
          jobCard={selectedJobCard}
          onClose={() => { setDialogOpen(false); setSelectedJobCard(null); }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Box>
  );
}
