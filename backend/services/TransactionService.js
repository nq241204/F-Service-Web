// services/TransactionService.js
const mongoose = require('mongoose');
const GiaoDich = require('../models/GiaoDich');
const ViGiaoDich = require('../models/ViGiaoDich');
const DichVu = require('../models/DichVu');
const config = require('../config/app');

class TransactionService {
    // Get user wallet
    static async getUserWallet(userId) {
        try {
            const wallet = await ViGiaoDich.findOne({ 
                ChuSoHuu: userId,
                LoaiVi: 'User'
            }).lean();
            return wallet;
        } catch (error) {
            console.error('Error getting user wallet:', error);
            return null;
        }
    }

    // Create escrow transaction (deduct money when service is accepted)
    static async createEscrowTransaction(userId, amount, description, serviceId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find user wallet
            const wallet = await ViGiaoDich.findOne({ 
                ChuSoHuu: userId,
                LoaiVi: 'User'
            }).session(session);

            if (!wallet) {
                throw new Error('Không tìm thấy ví của người dùng');
            }

            // Check balance
            if (wallet.SoDuHienTai < amount) {
                throw new Error('Số dư không đủ để thanh toán');
            }

            // Deduct from wallet
            wallet.SoDuHienTai -= amount;

            // Create escrow transaction
            const transaction = new GiaoDich({
                Loai: 'service_escrow',
                SoTien: amount,
                NguoiThamGia: userId,
                TrangThai: 'success',
                MoTa: description,
                DichVu: serviceId
            });

            // Save both
            await transaction.save({ session });
            await wallet.save({ session });

            wallet.SoDuHienTai -= amount;
            wallet.GiaoDich.push(transaction._id);

            await Promise.all([
                transaction.save({ session }),
                wallet.save({ session })
            ]);

            await session.commitTransaction();
            return { success: true, transaction };
        } catch (error) {
            await session.abortTransaction();
            return { success: false, message: error.message };
        } finally {
            session.endSession();
        }
    }

    // Transfer escrow to member wallet (95% to member, 5% to system)
    static async transferEscrowToMember(userId, amount, serviceId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find member wallet
            const memberWallet = await ViGiaoDich.findOne({ 
                ChuSoHuu: userId,
                LoaiVi: 'Member'
            }).session(session);

            if (!memberWallet) {
                throw new Error('Không tìm thấy ví thành viên');
            }

            // Calculate split: 95% to member, 5% to system
            const memberAmount = amount * 0.95;
            const systemAmount = amount * 0.05;

            // Create member payment transaction
            const memberTransaction = new GiaoDich({
                Loai: 'payment',
                SoTien: memberAmount,
                NguoiThamGia: userId,
                DichVu: serviceId,
                TrangThai: 'success',
                MoTa: 'Thanh toán dịch vụ hoàn thành'
            });

            // Create system commission transaction (no user for system transactions)
            const systemTransaction = new GiaoDich({
                Loai: 'commission',
                SoTien: systemAmount,
                NguoiThamGia: userId, // Use service creator as participant for system transactions
                DichVu: serviceId,
                TrangThai: 'success',
                MoTa: 'Phí hệ thống 5%'
            });

            // Update member wallet
            memberWallet.SoDuHienTai += memberAmount;
            memberWallet.GiaoDich.push(memberTransaction._id);

            await Promise.all([
                memberTransaction.save({ session }),
                systemTransaction.save({ session }),
                memberWallet.save({ session })
            ]);

            await session.commitTransaction();
            return { success: true, memberTransaction, systemTransaction };
        } catch (error) {
            await session.abortTransaction();
            return { success: false, message: error.message };
        } finally {
            session.endSession();
        }
    }

    // Get transaction statistics
    static async getTransactionStats(userId) {
        try {
            const stats = await GiaoDich.aggregate([
                {
                    $match: {
                        NguoiThamGia: mongoose.Types.ObjectId(userId),
                        TrangThai: 'success'
                    }
                },
                {
                    $group: {
                        _id: '$Loai',
                        total: { $sum: '$SoTien' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            return stats.reduce((acc, stat) => {
                acc[stat._id] = {
                    total: stat.total,
                    count: stat.count
                };
                return acc;
            }, {});
        } catch (error) {
            console.error('Error getting transaction stats:', error);
            return {};
        }
    }
}

module.exports = TransactionService;