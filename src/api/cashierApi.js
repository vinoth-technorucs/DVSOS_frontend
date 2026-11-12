import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getDashboardStats = () =>
  axiosInstance.get(ENDPOINTS.CASHIER.DASHBOARD_STATS);

export const getPendingPayments = (params = {}) =>
  axiosInstance.get(ENDPOINTS.CASHIER.PENDING_PAYMENTS, { params });

export const getPaymentHistory = (params = {}) =>
  axiosInstance.get(ENDPOINTS.CASHIER.PAYMENT_HISTORY, { params });

export const getJobCardDetail = (jobCardId) =>
  axiosInstance.get(ENDPOINTS.CASHIER.JOB_CARD_DETAIL(jobCardId));

export const markAsPaid = (jobCardId, payload) =>
  axiosInstance.patch(ENDPOINTS.CASHIER.MARK_PAID(jobCardId), payload);
