// services/TransactionAutoConfirmService.js
// Service tự động xác nhận giao dịch nạp/rút tiền sau một thời gian

const mongoose = require('mongoose');
const GiaoDich = require('../models/GiaoDich');
const ViGiaoDich = require('../models/ViGiaoDich');
const User = require('../models/User');
const Member = require('../models/Member');

class TransactionAutoConfirmService {
    // Xác nhận giao dịch nạp tiền tự động
    static async autoConfirmDeposit(transactionId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const transaction = await GiaoDich.findById(transactionId).session(session);
            
            if (!transaction || transaction.Loai !== 'deposit' || transaction.TrangThai !== 'pending') {
                throw new Error('Giao dịch không hợp lệ hoặc đã được xử lý');
            }

            // Lấy ví
            const wallet = await ViGiaoDich.findOne({
                ChuSoHuu: transaction.NguoiThamGia
            }).session(session);

            if (!wallet) {
                throw new Error('Ví không tồn tại');
            }

            // Cập nhật số dư ví
            wallet.SoDuHienTai += transaction.SoTien;
            transaction.TrangThai = 'success';
            transaction.NgayHoanThanh = new Date();

            // Lưu thay đổi
            await Promise.all([
                wallet.save({ session }),
                transaction.save({ session })
            ]);

            // Cập nhật User model
            await User.findByIdAndUpdate(
                transaction.NguoiThamGia,
                { 
                    $inc: { SoDu: transaction.SoTien }
                },
                { session }
            );

            // Cập nhật Member model nếu có
            const member = await Member.findOne({ UserId: transaction.NguoiThamGia }).session(session);
            if (member && !member.ViGiaoDich) {
                member.ViGiaoDich = wallet._id;
                await member.save({ session });
            }

            await session.commitTransaction();

            return {
                success: true,
                message: 'Giao dịch nạp tiền đã được xác nhận tự động',
                transaction,
                wallet
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Xác nhận giao dịch rút tiền tự động
    // NOTE: Tiền đã được trừ ngay khi tạo withdraw request
    // Xác nhận chỉ cần đánh dấu trạng thái thành công
    static async autoConfirmWithdraw(transactionId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const transaction = await GiaoDich.findById(transactionId).session(session);
            
            if (!transaction || transaction.Loai !== 'withdraw' || transaction.TrangThai !== 'pending') {
                throw new Error('Giao dịch không hợp lệ hoặc đã được xử lý');
            }

            // Lấy ví
            const wallet = await ViGiaoDich.findOne({
                ChuSoHuu: transaction.NguoiThamGia
            }).session(session);

            if (!wallet) {
                throw new Error('Ví không tồn tại');
            }

            // *** Cập nhật trạng thái giao dịch - tiền đã trừ rồi ***
            transaction.TrangThai = 'success';
            transaction.NgayHoanThanh = new Date();

            // Lưu thay đổi
            await Promise.all([
                wallet.save({ session }),
                transaction.save({ session })
            ]);

            // NOTE: KHÔNG trừ User.SoDu ở đây vì đã trừ khi tạo withdraw request

            await session.commitTransaction();

            return {
                success: true,
                message: 'Giao dịch rút tiền đã được xác nhận tự động',
                transaction,
                wallet
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Xử lý tất cả giao dịch pending (chạy định kỳ)
    // Tự động xác nhận các giao dịch sau N giây hoặc phút
    static async processAllPendingTransactions(timeoutMinutes = 5) {
        try {
            const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

            // Tìm tất cả giao dịch nạp/rút đã pending quá lâu
            const pendingTransactions = await GiaoDich.find({
                Loai: { $in: ['deposit', 'withdraw'] },
                TrangThai: 'pending',
                createdAt: { $lte: cutoffTime }
            }).select('_id Loai');

            console.log(`[Auto Confirm] Tìm thấy ${pendingTransactions.length} giao dịch để xác nhận tự động`);

            const results = {
                success: 0,
                failed: 0,
                errors: []
            };

            for (const tx of pendingTransactions) {
                try {
                    if (tx.Loai === 'deposit') {
                        await this.autoConfirmDeposit(tx._id);
                    } else if (tx.Loai === 'withdraw') {
                        await this.autoConfirmWithdraw(tx._id);
                    }
                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        transactionId: tx._id,
                        error: error.message
                    });
                }
            }

            console.log(`[Auto Confirm] Kết quả: ${results.success} thành công, ${results.failed} thất bại`);
            return results;
        } catch (error) {
            console.error('[Auto Confirm] Lỗi xử lý giao dịch pending:', error);
            throw error;
        }
    }

    // Kiểm tra và xác nhận giao dịch cụ thể
    static async checkAndConfirmTransaction(transactionId) {
        try {
            const transaction = await GiaoDich.findById(transactionId);
            
            if (!transaction || transaction.TrangThai !== 'pending') {
                return {
                    success: false,
                    message: 'Giao dịch không tồn tại hoặc đã được xử lý'
                };
            }

            // Kiểm tra thông tin thanh toán
            const isValid = await this.validateTransaction(transaction);
            
            if (!isValid) {
                return {
                    success: false,
                    message: 'Giao dịch không hợp lệ'
                };
            }

            // Xác nhận giao dịch
            if (transaction.Loai === 'deposit') {
                const result = await this.autoConfirmDeposit(transactionId);
                return {
                    success: true,
                    message: 'Giao dịch nạp tiền đã được xác nhận',
                    data: result.transaction
                };
            } else if (transaction.Loai === 'withdraw') {
                const result = await this.autoConfirmWithdraw(transactionId);
                return {
                    success: true,
                    message: 'Giao dịch rút tiền đã được xác nhận',
                    data: result.transaction
                };
            }
        } catch (error) {
            console.error('Lỗi kiểm tra và xác nhận giao dịch:', error);
            throw error;
        }
    }

    // Kiểm tra tính hợp lệ của giao dịch
    static async validateTransaction(transaction) {
        try {
            // Kiểm tra thông tin thanh toán
            if (!transaction.ThongTinThanhToan) {
                return false;
            }

            // Kiểm tra số tiền hợp lệ
            if (transaction.SoTien <= 0) {
                return false;
            }

            // Kiểm tra user tồn tại
            const user = await User.findById(transaction.NguoiThamGia);
            if (!user) {
                return false;
            }

            // Cho các giao dịch rút, kiểm tra xem ví có đủ tiền không
            if (transaction.Loai === 'withdraw') {
                const wallet = await ViGiaoDich.findOne({
                    ChuSoHuu: transaction.NguoiThamGia
                });
                if (!wallet || wallet.SoDuHienTai < transaction.SoTien) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Lỗi xác thực giao dịch:', error);
            return false;
        }
    }

    // Hủy giao dịch pending quá lâu
    static async cancelStaleTransactions(timeoutHours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

            // Tìm tất cả giao dịch pending quá lâu
            const staleTransactions = await GiaoDich.find({
                TrangThai: 'pending',
                createdAt: { $lte: cutoffTime }
            }).select('_id Loai SoTien NguoiThamGia');

            console.log(`[Cancel Stale] Tìm thấy ${staleTransactions.length} giao dịch để hủy`);

            const results = {
                cancelled: 0,
                refunded: 0,
                errors: []
            };

            for (const tx of staleTransactions) {
                try {
                    // Cập nhật trạng thái
                    tx.TrangThai = 'cancelled';
                    tx.LyDoHuy = 'Giao dịch bị hủy do quá thời hạn xử lý (24 giờ)';
                    tx.NgayHuy = new Date();
                    await tx.save();

                    // Hoàn tiền cho giao dịch rút
                    if (tx.Loai === 'withdraw') {
                        const wallet = await ViGiaoDich.findOne({
                            ChuSoHuu: tx.NguoiThamGia
                        });
                        if (wallet) {
                            wallet.SoDuHienTai += tx.SoTien;
                            await wallet.save();
                            results.refunded++;
                        }
                    }

                    results.cancelled++;
                } catch (error) {
                    results.errors.push({
                        transactionId: tx._id,
                        error: error.message
                    });
                }
            }

            console.log(`[Cancel Stale] Kết quả: ${results.cancelled} hủy, ${results.refunded} hoàn tiền`);
            return results;
        } catch (error) {
            console.error('[Cancel Stale] Lỗi hủy giao dịch:', error);
            throw error;
        }
    }
}

module.exports = TransactionAutoConfirmService;
