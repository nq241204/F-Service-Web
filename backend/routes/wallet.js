// routes/wallet.js
const express = require('express');
const router = express.Router();
const { 
  walletValidations,
  handleValidationErrors 
} = require('../middleware/validationMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');
const walletController = require('../controllers/walletController');

// Middleware chung cho wallet routes
const auth = authMiddleware(['user', 'member']);
const adminAuth = authMiddleware(['admin']);

// @route   GET /api/wallet/balance
// @desc    Lấy số dư ví
router.get('/balance', auth, walletController.getBalance);

// @route   POST /api/wallet/deposit
// @desc    Nạp tiền vào ví (tạo giao dịch pending)
router.post(
    '/deposit',
    auth,
    [
      ...walletValidations.deposit,
      handleValidationErrors
    ],
    walletController.deposit
);

// @route   POST /api/wallet/generate-qr
// @desc    Tạo mã QR cho nạp tiền
router.post(
    '/generate-qr',
    auth,
    walletController.generateQRCode
);

// @route   POST /api/wallet/generate-qr-public
// @desc    Tạo mã QR cho nạp tiền (public test - no auth)
router.post('/generate-qr-public', walletController.generateQRCode);

// @route   POST /api/wallet/confirm-deposit/:transactionId
// @desc    Admin xác nhận giao dịch nạp tiền
router.post(
    '/confirm-deposit/:transactionId',
    adminAuth,
    walletController.confirmDeposit
);

// @route   POST /api/wallet/reject-deposit/:transactionId
// @desc    Admin từ chối giao dịch nạp tiền
router.post(
    '/reject-deposit/:transactionId',
    adminAuth,
    walletController.rejectDeposit
);

// @route   POST /api/wallet/withdraw
// @desc    Rút tiền từ ví (tạo giao dịch pending)
router.post(
    '/withdraw',
    auth,
    walletController.withdraw
);

// @route   POST /api/wallet/confirm-withdraw/:transactionId
// @desc    Xác nhận giao dịch rút tiền
router.post(
    '/confirm-withdraw/:transactionId',
    auth,
    walletController.confirmWithdraw
);

// @route   GET /api/wallet/transactions
// @desc    Lấy lịch sử giao dịch
router.get('/transactions', auth, transactionController.getTransactions);

// @route   GET /api/wallet
// @desc    Lấy thông tin ví
router.get('/', auth, walletController.getWallet);

module.exports = router;