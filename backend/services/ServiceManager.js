// services/ServiceManager.js
const mongoose = require('mongoose');
const DichVu = require('../models/DichVu');
const User = require('../models/User');
const GiaoDich = require('../models/GiaoDich');
const ViGiaoDich = require('../models/ViGiaoDich');
const config = require('../config/app');
const logger = require('../config/logger');

class ServiceManager {
    // Tạo dịch vụ mới
    static async createService(serviceData, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Validate người tạo
            const user = await User.findById(userId).session(session);
            if (!user) {
                throw new Error('Người dùng không tồn tại');
            }

            // Kiểm tra và xác thực giá tiền
            const giaTien = parseInt(serviceData.giaTien);
            if (!giaTien || giaTien <= 0) {
                throw new Error('Giá tiền phải là số dương');
            }

            // Kiểm tra số dư ví của người dùng
            const userWallet = await ViGiaoDich.findOne({ 
                ChuSoHuu: userId,
                LoaiVi: 'User'
            }).session(session);

            if (!userWallet) {
                throw new Error('Người dùng chưa có ví giao dịch');
            }

            if (userWallet.SoDuHienTai < giaTien) {
                throw new Error(`Số dư không đủ. Cần ${giaTien.toLocaleString('vi-VN')}đ, hiện có ${userWallet.SoDuHienTai.toLocaleString('vi-VN')}đ`);
            }

            // Tạo dịch vụ
            const service = new DichVu({
                TenDichVu: serviceData.tenDichVu,
                MoTa: serviceData.moTa,
                Gia: giaTien,
                GiaAI: giaTien,
                DonVi: serviceData.donVi || 'VND',
                LinhVuc: serviceData.linhVuc,
                NguoiDung: userId,
                TrangThai: 'cho-duyet'
            });

            // Thêm hình ảnh nếu có
            if (serviceData.hinhAnh && serviceData.hinhAnh.length > 0) {
                service.HinhAnh = serviceData.hinhAnh;
            }

            await service.save({ session });

            // Tạo giao dịch escrow để khóa tiền
            const escrowTransaction = new GiaoDich({
                Loai: 'service_escrow',
                SoTien: giaTien,
                NguoiThamGia: userId,
                DichVu: service._id,
                TrangThai: 'success',
                MoTa: `Khóa tiền cho dịch vụ: ${serviceData.tenDichVu}`
            });

            // Trừ tiền từ ví và cập nhật giao dịch
            userWallet.SoDuHienTai -= giaTien;
            userWallet.GiaoDich = userWallet.GiaoDich || [];
            userWallet.GiaoDich.push(escrowTransaction._id);

            // Cập nhật danh sách dịch vụ của user
            user.DichVu = user.DichVu || [];
            user.DichVu.push(service._id);

            // Lưu tất cả thay đổi
            await Promise.all([
                service.save({ session }),
                escrowTransaction.save({ session }),
                userWallet.save({ session }),
                user.save({ session })
            ]);

            await session.commitTransaction();
            return service;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Cập nhật dịch vụ
    static async updateService(serviceId, updateData, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Kiểm tra quyền
            const service = await DichVu.findById(serviceId).session(session);

            if (!service) {
                throw new Error('Dịch vụ không tồn tại');
            }

            if (service.TrangThai === 'da-nhan' && updateData.Gia) {
                throw new Error('Không thể thay đổi giá dịch vụ đang hoạt động');
            }

            // Cập nhật thông tin
            Object.assign(service, updateData);
            await service.save({ session });

            await session.commitTransaction();
            return service;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Đăng ký sử dụng dịch vụ
    static async registerService(serviceId, userId, registrationData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Kiểm tra dịch vụ
            const service = await DichVu.findById(serviceId).session(session);
            if (!service || service.TrangThai !== 'active') {
                throw new Error('Dịch vụ không khả dụng');
            }

            // Kiểm tra số dư
            const userWallet = await ViGiaoDich.findOne({ 
                ChuSoHuu: userId 
            }).session(session);

            if (!userWallet || userWallet.SoDuHienTai < service.Gia) {
                throw new Error('Số dư không đủ để đăng ký dịch vụ');
            }

            // Tạo giao dịch
            const transaction = new GiaoDich({
                Loai: 'service_payment',
                SoTien: service.Gia,
                NguoiThamGia: userId,
                DichVu: serviceId,
                TrangThai: 'success',
                MoTa: `Đăng ký dịch vụ: ${service.TenDichVu}`
            });

            // Cập nhật số dư
            userWallet.SoDuHienTai -= service.Gia;
            userWallet.GiaoDich.push(transaction._id);

            // Cập nhật thông tin dịch vụ
            service.NguoiDung = service.NguoiDung || [];
            service.NguoiDung.push({
                userId,
                dangKyInfo: registrationData,
                trangThai: 'active',
                ngayDangKy: new Date()
            });

            await Promise.all([
                transaction.save({ session }),
                userWallet.save({ session }),
                service.save({ session })
            ]);

            await session.commitTransaction();
            return {
                service,
                transaction
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Hủy dịch vụ
    static async cancelService(serviceId, userId, reason) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Kiểm tra dịch vụ
            const service = await DichVu.findById(serviceId).session(session);
            if (!service) {
                throw new Error('Dịch vụ không tồn tại');
            }

            // Kiểm tra quyền
            const isOwner = service.NguoiDung.toString() === userId.toString();
            const isUser = service.NguoiDung && service.NguoiDung.some(
                u => u.userId.toString() === userId.toString() && u.trangThai === 'active'
            );

            if (!isOwner && !isUser) {
                throw new Error('Không có quyền hủy dịch vụ');
            }

            if (isOwner) {
                // Chủ dịch vụ hủy
                service.TrangThai = 'huy-bo';
                service.LyDoHuy = reason;

                // Hoàn tiền cho người dùng đang sử dụng
                const refunds = await Promise.all(
                    service.NguoiDung
                        .filter(u => u.trangThai === 'hoan-thanh')
                        .map(async (user) => {
                            const userWallet = await ViGiaoDich.findOne({
                                ChuSoHuu: user.userId
                            }).session(session);

                            if (userWallet) {
                                const refundTx = new GiaoDich({
                                    Loai: 'service_refund',
                                    SoTien: service.Gia,
                                    NguoiThamGia: user.userId,
                                    DichVu: serviceId,
                                    TrangThai: 'success',
                                    MoTa: `Hoàn tiền dịch vụ: ${service.TenDichVu}`
                                });

                                userWallet.SoDuHienTai += service.Gia;
                                userWallet.GiaoDich.push(refundTx._id);

                                return Promise.all([
                                    refundTx.save({ session }),
                                    userWallet.save({ session })
                                ]);
                            }
                        })
                );

                await Promise.all([service.save({ session }), ...refunds]);
            } else {
                // Người dùng hủy
                const userIndex = service.NguoiDung.findIndex(
                    u => u.userId.toString() === userId.toString()
                );
                service.NguoiDung[userIndex].trangThai = 'huy-bo';
                service.NguoiDung[userIndex].lyDoHuy = reason;
                service.NguoiDung[userIndex].ngayHuy = new Date();

                await service.save({ session });
            }

            await session.commitTransaction();
            return service;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Lấy thống kê dịch vụ
    static async getServiceStats(serviceId, startDate, endDate) {
        const stats = await GiaoDich.aggregate([
            {
                $match: {
                    DichVu: mongoose.Types.ObjectId(serviceId),
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    },
                    TrangThai: 'success'
                }
            },
            {
                $group: {
                    _id: {
                        type: '$Loai',
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                    },
                    total: { $sum: '$SoTien' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.type',
                    daily: {
                        $push: {
                            date: '$_id.date',
                            total: '$total',
                            count: '$count'
                        }
                    },
                    totalAmount: { $sum: '$total' },
                    totalCount: { $sum: '$count' }
                }
            }
        ]);

        // Lấy thông tin người dùng
        const userStats = await DichVu.findById(serviceId)
            .select('NguoiDung')
            .lean();

        const userCounts = {
            total: 0,
            active: 0,
            cancelled: 0
        };

        if (userStats && userStats.NguoiDung) {
            userStats.NguoiDung.forEach(user => {
                userCounts.total++;
                if (user.trangThai === 'active') userCounts.active++;
                if (user.trangThai === 'cancelled') userCounts.cancelled++;
            });
        }

        return {
            transactions: stats.reduce((acc, stat) => {
                acc[stat._id] = {
                    daily: stat.daily,
                    total: stat.totalAmount,
                    count: stat.totalCount
                };
                return acc;
            }, {}),
            userCounts
        };
    }

    // Phê duyệt dịch vụ - chỉ đổi trạng thái, không chuyển tiền
    static async approveService(serviceId, adminId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log('Approving service:', serviceId, 'by admin:', adminId);
            
            // Tìm dịch vụ
            const service = await DichVu.findById(serviceId).session(session);
            if (!service) {
                throw new Error('Dịch vụ không tồn tại');
            }

            console.log('Service found:', service.TenDichVu, 'status:', service.TrangThai);

            // Kiểm tra trạng thái
            if (service.TrangThai !== 'cho-duyet') {
                throw new Error('Chỉ có thể phê duyệt dịch vụ đang chờ duyệt. Hiện tại: ' + service.TrangThai);
            }

            console.log('✅ Service approved - status changed to da-duyet');
            console.log('✅ Money will be transferred to escrow when member accepts service');
            
            // Chỉ đổi trạng thái sang "da-duyet", không chuyển tiền
            service.TrangThai = 'da-duyet';
            await service.save({ session });

            await session.commitTransaction();
            return { 
                service, 
                message: 'Dịch vụ đã được phê duyệt. Tiền sẽ được chuyển vào ký quỹ khi có thành viên nhận yêu cầu.',
                escrowCreated: false
            };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Từ chối dịch vụ - hoàn tiền escrow cho người tạo
    static async rejectService(serviceId, adminId, reason) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Tìm dịch vụ
            const service = await DichVu.findById(serviceId).session(session);
            if (!service) {
                throw new Error('Dịch vụ không tồn tại');
            }

            // Kiểm tra trạng thái
            if (service.TrangThai !== 'cho-duyet') {
                throw new Error('Chỉ có thể từ chối dịch vụ đang chờ duyệt');
            }

            // Tìm giao dịch escrow của dịch vụ
            const escrowTransaction = await GiaoDich.findOne({
                DichVu: serviceId,
                Loai: 'service_escrow',
                TrangThai: 'success'
            }).session(session);

            if (!escrowTransaction) {
                throw new Error('Không tìm thấy giao dịch escrow của dịch vụ');
            }

            // Tìm ví của người tạo dịch vụ
            const creatorWallet = await ViGiaoDich.findOne({
                ChuSoHuu: service.NguoiDung,
                LoaiVi: 'User'
            }).session(session);

            if (!creatorWallet) {
                throw new Error('Không tìm thấy ví của người tạo dịch vụ');
            }

            // Tạo giao dịch hoàn tiền
            const refundTransaction = new GiaoDich({
                Loai: 'service_refund',
                SoTien: escrowTransaction.SoTien,
                NguoiThamGia: service.NguoiDung,
                TrangThai: 'success',
                MoTa: `Hoàn tiền dịch vụ ${service.TenDichVu} - Lý do: ${reason}`,
                DichVu: serviceId
            });

            await refundTransaction.save({ session });

            // Cập nhật số dư ví người tạo
            creatorWallet.SoDuHienTai += escrowTransaction.SoTien;
            creatorWallet.GiaoDich.push(refundTransaction._id);
            await creatorWallet.save({ session });

            // Cập nhật trạng thái dịch vụ
            service.TrangThai = 'huy-bo';
            await service.save({ session });

            await session.commitTransaction();
            return { service, refundTransaction };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = ServiceManager;