// frontend/src/services/walletService.js
import api from '../config/api';

export const walletService = {
  // Lấy thông tin ví đầy đủ (bao gồm số dư, lịch sử, thống kê)
  getWallet: async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 walletService.getWallet called');
    }
    const response = await api.get('/wallet');
    return response.data;
  },

  // Lấy số dư ví
  getBalance: async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 walletService.getBalance called');
    }
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  // Nạp tiền vào ví
  deposit: async (amount, method, provider) => {
    const response = await api.post('/wallet/deposit', {
      amount,
      method, // 'transfer', 'qrcode'
      provider, // 'momo', 'zalopay', 'bank'
    });
    return response.data;
  },

  // Tạo mã QR cho nạp tiền
  generateQRCode: async (amount, provider) => {
    const response = await api.post('/wallet/generate-qr', {
      amount,
      provider, // 'momo', 'zalopay', 'bank'
    });
    return response.data;
  },

  // Test endpoint for QR code (no auth required)
  generateQRCodePublic: async (amount) => {
    const response = await api.post('/wallet/generate-qr-public', {
      amount,
    });
    return response.data;
  },

  // Rút tiền từ ví
  withdraw: async (amount, bankInfo) => {
    const response = await api.post('/wallet/withdraw', {
      amount,
      bankInfo: {
        accountNumber: bankInfo.accountNumber,
        bankName: bankInfo.bankName,
        accountHolder: bankInfo.accountHolder,
      },
    });
    return response.data;
  },

  // Lấy lịch sử giao dịch
  getTransactions: async (page = 1, limit = 20) => {
    const response = await api.get('/wallet/transactions', {
      params: { page, limit },
    });
    return response.data;
  },
};

