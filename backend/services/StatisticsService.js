// services/StatisticsService.js
// Service tập trung tính toán thống kê chính xác cho user

const mongoose = require('mongoose');
const GiaoDich = require('../models/GiaoDich');
const ViGiaoDich = require('../models/ViGiaoDich');
const User = require('../models/User');
const UyThac = require('../models/UyThac');
const logger = require('../config/logger');

class StatisticsService {
    /**
     * Lấy thống kê ví đầy đủ cho user
     * @param {ObjectId} userId - ID của user
     * @returns {Promise<Object>} Thống kê đầy đủ
     */
    static async getWalletStatistics(userId) {
        try {
            // Lấy thông tin ví
            const wallet = await ViGiaoDich.findOne({
                ChuSoHuu: userId,
                LoaiVi: 'User'
            }).lean();

            if (!wallet) {
                throw new Error('Ví không tồn tại');
            }

            // Lấy tất cả giao dịch của user
            const transactions = await GiaoDich.find({
                NguoiThamGia: userId
            }).lean();

            // Tính toán thống kê
            const stats = {
                balance: wallet.SoDuHienTai,
                balanceFormatted: this.formatCurrency(wallet.SoDuHienTai),
                totalDeposit: 0,
                totalDepositFormatted: '0₫',
                totalWithdraw: 0,
                totalWithdrawFormatted: '0₫',
                totalCommission: 0,
                totalCommissionFormatted: '0₫',
                totalPaid: 0,
                totalPaidFormatted: '0₫',
                netBalance: 0,
                pendingTransactions: 0,
                successfulTransactions: 0,
                failedTransactions: 0,
                cancelledTransactions: 0,
                totalTransactions: transactions.length,
                lastTransactionDate: null,
                transactions: []
            };

            // Tính toán từ giao dịch
            transactions.forEach(tx => {
                stats.transactions.push({
                    _id: tx._id,
                    type: tx.Loai,
                    amount: tx.SoTien,
                    amountFormatted: this.formatCurrency(tx.SoTien),
                    status: tx.TrangThai,
                    description: tx.MoTa,
                    date: tx.NgayGiaoDich || tx.createdAt,
                    completedAt: tx.NgayHoanThanh
                });

                // Chỉ tính giao dịch thành công
                if (tx.TrangThai === 'success') {
                    switch (tx.Loai) {
                        case 'deposit':
                            stats.totalDeposit += tx.SoTien;
                            break;
                        case 'withdraw':
                            stats.totalWithdraw += tx.SoTien;
                            break;
                        case 'commission_payment':
                            stats.totalCommission += tx.SoTien;
                            break;
                        case 'service_escrow':
                            stats.totalPaid += tx.SoTien;
                            logger.info(`Adding escrow payment: ${tx.SoTien}, Total paid: ${stats.totalPaid}`);
                            break;
                        case 'service_payment': // For backward compatibility
                            stats.totalPaid += tx.SoTien;
                            logger.info(`Adding service payment: ${tx.SoTien}, Total paid: ${stats.totalPaid}`);
                            break;
                    }
                    stats.successfulTransactions++;
                } else if (tx.TrangThai === 'pending') {
                    stats.pendingTransactions++;
                } else if (tx.TrangThai === 'failed') {
                    stats.failedTransactions++;
                } else if (tx.TrangThai === 'cancelled') {
                    stats.cancelledTransactions++;
                }

                // Cập nhật ngày giao dịch cuối cùng
                if (!stats.lastTransactionDate || new Date(tx.createdAt) > new Date(stats.lastTransactionDate)) {
                    stats.lastTransactionDate = tx.createdAt;
                }
            });

            // Tính net balance - SAI LOGIC! Cần tính: Tổng nạp - Tổng rút - Tổng đã trả cho dịch vụ
            // stats.netBalance = stats.totalDeposit - stats.totalWithdraw; // SAI
            stats.netBalance = stats.totalDeposit - stats.totalWithdraw - stats.totalPaid; // ĐÚNG
            stats.totalDepositFormatted = this.formatCurrency(stats.totalDeposit);
            stats.totalWithdrawFormatted = this.formatCurrency(stats.totalWithdraw);
            stats.totalCommissionFormatted = this.formatCurrency(stats.totalCommission);
            stats.totalPaidFormatted = this.formatCurrency(stats.totalPaid);

            // DEBUG: Log để kiểm tra logic
            logger.info(`Wallet stats for user ${userId}:`, {
                balance: stats.balance,
                totalDeposit: stats.totalDeposit,
                totalWithdraw: stats.totalWithdraw,
                totalPaid: stats.totalPaid,
                netBalance: stats.netBalance,
                calculatedBalance: stats.totalDeposit - stats.totalWithdraw - stats.totalPaid,
                transactionsCount: stats.transactions.length,
                escrowTransactions: stats.transactions.filter(tx => tx.Loai === 'service_escrow').length,
                allTransactions: stats.transactions.map(tx => ({ type: tx.Loai, amount: tx.SoTien, status: tx.TrangThai }))
            });

            // Kiểm tra sự nhất quán giữa số dư ví và tính toán
            const calculatedBalance = stats.totalDeposit - stats.totalWithdraw - stats.totalPaid;
            if (Math.abs(stats.balance - calculatedBalance) > 100) { // Chênh lệch > 100đ
                logger.warn(`Balance inconsistency detected for user ${userId}:`, {
                    walletBalance: stats.balance,
                    calculatedBalance: calculatedBalance,
                    difference: stats.balance - calculatedBalance
                });
            }

            // Sắp xếp giao dịch theo thời gian mới nhất trước
            stats.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Kiểm tra và đồng bộ hóa User.SoDu
            const user = await User.findById(userId).select('SoDu').lean();
            if (user && user.SoDu !== stats.balance) {
                await User.findByIdAndUpdate(userId, { SoDu: stats.balance });
            }

            return stats;
        } catch (error) {
            logger.error('Error getting wallet statistics:', error);
            throw error;
        }
    }

    /**
     * Lấy thống kê ủy thác (commissions)
     * @param {ObjectId} userId - ID của user
     * @returns {Promise<Object>} Thống kê ủy thác
     */
    static async getCommissionStatistics(userId) {
        try {
            const commissions = await UyThac.find({
                $or: [
                    { UserId: userId },      // User yêu cầu dịch vụ
                    { MemberId: userId }     // Member thực hiện dịch vụ
                ]
            }).lean();

            const stats = {
                totalCommissions: commissions.length,
                completedCommissions: 0,
                inProgressCommissions: 0,
                pendingCommissions: 0,
                cancelledCommissions: 0,
                totalEarned: 0,
                totalSpent: 0,
                commissions: []
            };

            commissions.forEach(commission => {
                const status = commission.TrangThai || commission.TrangThaiThanhToan;
                
                stats.commissions.push({
                    _id: commission._id,
                    status: status,
                    amount: commission.SoTien || commission.TienThanhToan || 0,
                    amountFormatted: this.formatCurrency(commission.SoTien || commission.TienThanhToan || 0),
                    date: commission.NgayTao || commission.createdAt
                });

                // Tính trạng thái
                if (status === 'completed' || status === 'hoan-thanh' || status === 'DaHoanThanh') {
                    stats.completedCommissions++;
                    if (commission.MemberId?.toString() === userId.toString()) {
                        stats.totalEarned += commission.SoTien || 0;
                    } else {
                        stats.totalSpent += commission.SoTien || 0;
                    }
                } else if (status === 'in_progress' || status === 'dang-thuc-hien' || status === 'DangThucHien') {
                    stats.inProgressCommissions++;
                } else if (status === 'pending' || status === 'cho-xu-ly' || status === 'ChoXuLy') {
                    stats.pendingCommissions++;
                } else if (status === 'cancelled' || status === 'huy' || status === 'Huy') {
                    stats.cancelledCommissions++;
                }
            });

            return stats;
        } catch (error) {
            logger.error('Error getting commission statistics:', error);
            throw error;
        }
    }

    /**
     * Lấy thống kê tổng hợp đầy đủ
     * @param {ObjectId} userId - ID của user
     * @returns {Promise<Object>} Thống kê tổng hợp
     */
    static async getFullStatistics(userId) {
        try {
            const [walletStats, commissionStats] = await Promise.all([
                this.getWalletStatistics(userId),
                this.getCommissionStatistics(userId)
            ]);

            return {
                wallet: walletStats,
                commissions: commissionStats,
                summary: {
                    balance: walletStats.balance,
                    balanceFormatted: walletStats.balanceFormatted,
                    totalDeposit: walletStats.totalDeposit,
                    totalDepositFormatted: walletStats.totalDepositFormatted,
                    totalWithdraw: walletStats.totalWithdraw,
                    totalWithdrawFormatted: walletStats.totalWithdrawFormatted,
                    totalCommission: walletStats.totalCommission,
                    totalCommissionFormatted: walletStats.totalCommissionFormatted,
                    totalEarned: commissionStats.totalEarned,
                    totalEarnedFormatted: this.formatCurrency(commissionStats.totalEarned),
                    totalSpent: commissionStats.totalSpent,
                    totalSpentFormatted: this.formatCurrency(commissionStats.totalSpent),
                    activeCommissions: commissionStats.inProgressCommissions,
                    pendingCommissions: walletStats.pendingTransactions,
                    successfulTransactions: walletStats.successfulTransactions
                }
            };
        } catch (error) {
            logger.error('Error getting full statistics:', error);
            throw error;
        }
    }

    /**
     * Định dạng tiền VND
     * @param {Number} amount - Số tiền
     * @returns {String} Tiền đã định dạng
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    }

    /**
     * Đồng bộ hóa dữ liệu user
     * @param {ObjectId} userId - ID của user
     * @returns {Promise<Object>} Kết quả đồng bộ
     */
    static async syncUserData(userId) {
        try {
            const stats = await this.getWalletStatistics(userId);

            // Cập nhật User.SoDu
            await User.findByIdAndUpdate(userId, {
                SoDu: stats.balance
            });

            return {
                success: true,
                synced: true,
                balance: stats.balance,
                message: 'Dữ liệu user đã được đồng bộ'
            };
        } catch (error) {
            logger.error('Error syncing user data:', error);
            throw error;
        }
    }

    /**
     * Đồng bộ hóa tất cả user
     * @returns {Promise<Object>} Kết quả đồng bộ
     */
    static async syncAllUsers() {
        try {
            const users = await User.find({ role: { $in: ['user', 'member'] } }).select('_id').lean();

            let synced = 0;
            let failed = 0;
            const errors = [];

            for (const user of users) {
                try {
                    await this.syncUserData(user._id);
                    synced++;
                } catch (error) {
                    failed++;
                    errors.push({
                        userId: user._id,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                synced,
                failed,
                total: users.length,
                errors: errors.length > 0 ? errors : undefined
            };
        } catch (error) {
            logger.error('Error syncing all users:', error);
            throw error;
        }
    }
}

module.exports = StatisticsService;
