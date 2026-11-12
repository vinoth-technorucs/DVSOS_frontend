import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, InputAdornment,
  MenuItem, Select, FormControl, Chip
} from '@mui/material';
import { Search, CreditCard, Banknote, Smartphone, Globe } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import DateFilter from '../../components/common/DateFilter';
import { getPaymentHistory } from '../../api/cashierApi';
import { format } from 'date-fns';

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

export default function PaymentHistory() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(15);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPaymentHistory({
        search: debouncedSearch,
        paymentMode: paymentMode || undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        page: page + 1,
        limit
      });
      setRows(response.data || []);
      setTotal(response.meta?.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, paymentMode, dateRange, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    {
      header: 'Paid At',
      accessor: 'paymentDoneAt',
      render: (row) => (
        <Typography sx={{ fontSize: '0.825rem', color: '#475569', fontWeight: 500 }}>
          {row.paymentDoneAt ? format(new Date(row.paymentDoneAt), 'dd MMM yyyy, hh:mm a') : '—'}
        </Typography>
      )
    },
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
      header: 'Mode',
      accessor: 'paymentMode',
      render: (row) => {
        const mode = row.paymentMode || 'CASH';
        const Icon = PAYMENT_MODE_ICONS[mode] || CreditCard;
        const style = PAYMENT_MODE_COLORS[mode] || PAYMENT_MODE_COLORS.CASH;
        return (
          <Chip
            icon={<Icon size={12} />}
            label={mode}
            size="small"
            sx={{
              bgcolor: style.bg,
              color: style.color,
              border: `1px solid ${style.border}`,
              fontWeight: 700,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { color: style.color }
            }}
          />
        );
      }
    },
    {
      header: 'Amount Paid',
      accessor: 'paidAmount',
      render: (row) => (
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#059669' }}>
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(row.paidAmount || 0)}
        </Typography>
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
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.25rem' }}>
          Payment History
        </Typography>
        <Typography sx={{ color: '#64748B', fontSize: '0.875rem', mt: 0.3 }}>
          {loading ? '...' : `${total} payment record${total !== 1 ? 's' : ''}`}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          size="small"
          placeholder="Search vehicle, customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={16} color="#94A3B8" /></InputAdornment>
          }}
          sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC' } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            displayEmpty
            sx={{ borderRadius: '10px', bgcolor: '#F8FAFC' }}
          >
            <MenuItem value="">All Modes</MenuItem>
            <MenuItem value="CASH">Cash</MenuItem>
            <MenuItem value="CARD">Card</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="ONLINE">Online</MenuItem>
          </Select>
        </FormControl>
        <DateFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onStartDateChange={(v) => setDateRange((p) => ({ ...p, startDate: v }))}
          onEndDateChange={(v) => setDateRange((p) => ({ ...p, endDate: v }))}
        />
      </Box>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        serverSide
        totalCount={total}
        page={page}
        rowsPerPage={limit}
        onPageChange={setPage}
        emptyMessage="No payment records found"
        rowsPerPageOptions={[15]}
      />
    </Box>
  );
}
