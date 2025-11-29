// backend/services/AdminStatsService.js
const User = require('../models/User');
const Member = require('../models/Member');
const DichVu = require('../models/DichVu');
const GiaoDich = require('../models/GiaoDich');
const ViGiaoDich = require('../models/ViGiaoDich');

class AdminStatsService {
    static async getUnifiedStats() {
        try {
            const [
                totalUsers,
                activeUsers,
                inactiveUsers,
                bannedUsers,
                userRoleUsers,
                memberRoleUsers,
                adminRoleUsers,
                totalMembers,
                activeMembers,
                inactiveMembers,
                pendingMembers,
                choDuyetMembers,
                totalServices,
                pendingServices,
                approvedServices,
                inProgressServices,
                completedServices,
                cancelledServices,
                totalTransactions,
                successfulTransactions,
                pendingTransactions,
                failedTransactions,
                depositTransactions,
                withdrawTransactions,
                pendingWithdraws,
                pendingDeposits,
                servicePaymentTransactions,
                commissionTransactions,
                totalWallets,
                walletBalanceResult
            ] = await Promise.all([
                // User stats
                User.countDocuments(),
                User.countDocuments({ status: 'active' }),
                User.countDocuments({ status: 'inactive' }),
                User.countDocuments({ status: 'banned' }),
                User.countDocuments({ role: 'user' }),
                User.countDocuments({ role: 'member' }),
                User.countDocuments({ role: 'admin' }),
                
                // Member stats
                Member.countDocuments(),
                Member.countDocuments({ TrangThai: 'active' }),
                Member.countDocuments({ TrangThai: 'inactive' }),
                Member.countDocuments({ TrangThai: 'pending' }),
                Member.countDocuments({ TrangThai: 'cho-duyet' }),
                
                // Service stats
                DichVu.countDocuments(),
                DichVu.countDocuments({ TrangThai: 'cho-duyet' }),
                DichVu.countDocuments({ TrangThai: 'da-duyet' }),
                DichVu.countDocuments({ TrangThai: 'dang-thuc-hien' }),
                DichVu.countDocuments({ TrangThai: 'hoan-thanh' }),
                DichVu.countDocuments({ TrangThai: 'huy-bo' }),
                
                // Transaction stats
                GiaoDich.countDocuments(),
                GiaoDich.countDocuments({ TrangThai: 'success' }),
                GiaoDich.countDocuments({ TrangThai: 'pending' }),
                GiaoDich.countDocuments({ TrangThai: 'failed' }),
                GiaoDich.countDocuments({ Loai: 'deposit' }),
                GiaoDich.countDocuments({ Loai: 'withdraw' }),
                GiaoDich.countDocuments({ Loai: 'withdraw', TrangThai: 'pending' }),
                GiaoDich.countDocuments({ Loai: 'deposit', TrangThai: 'pending' }),
                GiaoDich.countDocuments({ Loai: 'service_payment' }),
                GiaoDich.countDocuments({ Loai: 'commission' }),
                
                // Wallet stats
                ViGiaoDich.countDocuments(),
                ViGiaoDich.aggregate([
                    { $group: { _id: null, total: { $sum: '$SoDuHienTai' } } }
                ])
            ]);

            const totalBalance = walletBalanceResult.length > 0 ? walletBalanceResult[0].total : 0;

            const stats = {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: inactiveUsers,
                    banned: bannedUsers,
                    byRole: {
                        user: userRoleUsers,
                        member: memberRoleUsers,
                        admin: adminRoleUsers
                    }
                },
                members: {
                    total: totalMembers,
                    active: activeMembers,
                    inactive: inactiveMembers,
                    pending: pendingMembers + choDuyetMembers
                },
                services: {
                    total: totalServices,
                    pending: pendingServices,
                    approved: approvedServices,
                    inProgress: inProgressServices,
                    completed: completedServices,
                    cancelled: cancelledServices
                },
                transactions: {
                    total: totalTransactions,
                    successful: successfulTransactions,
                    pending: pendingTransactions,
                    failed: failedTransactions,
                    pendingWithdraws: pendingWithdraws,
                    pendingDeposits: pendingDeposits,
                    byType: {
                        deposit: depositTransactions,
                        withdraw: withdrawTransactions,
                        service_payment: servicePaymentTransactions,
                        commission: commissionTransactions
                    }
                },
                wallets: {
                    total: totalWallets,
                    totalBalance: totalBalance
                }
            };

            return stats;
        } catch (error) {
            console.error('Error in AdminStatsService.getUnifiedStats:', error);
            throw error;
        }
    }

    static async getDashboardStats() {
        try {
            const unifiedStats = await this.getUnifiedStats();
            
            // Get recent data
            const recentUsers = await User.find({})
                .select('name email createdAt')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();
                
            const recentMembers = await Member.find({})
                .select('Ten CapBac LinhVuc NgayTao')
                .sort({ NgayTao: -1 })
                .limit(5)
                .lean();
                
            const recentTransactions = await GiaoDich.find({})
                .populate('NguoiThamGia', 'name')
                .sort({ NgayGiaoDich: -1 })
                .limit(5)
                .lean();
            
            // Format for dashboard
            return {
                success: true,
                data: {
                    basic: {
                        totalUsers: unifiedStats.users.total,
                        totalMembers: unifiedStats.members.total,
                        totalServices: unifiedStats.services.total,
                        totalTransactions: unifiedStats.transactions.total,
                        pendingServices: unifiedStats.services.pending,
                        pendingWithdraws: unifiedStats.transactions.pendingWithdraws,
                        pendingDeposits: unifiedStats.transactions.pendingDeposits,
                        pendingMembers: unifiedStats.members.pending
                    },
                    recent: {
                        users: recentUsers,
                        members: recentMembers,
                        transactions: recentTransactions
                    },
                    detailed: unifiedStats,
                    lastUpdated: new Date()
                }
            };
        } catch (error) {
            console.error('Error in AdminStatsService.getDashboardStats:', error);
            throw error;
        }
    }

    static async getUserStats() {
        try {
            const stats = await this.getUnifiedStats();
            const users = await User.find({})
                .select('-password')
                .sort({ createdAt: -1 })
                .lean();
            
            return {
                success: true,
                data: {
                    users: users,
                    statistics: stats.users,
                    pagination: {
                        page: 1,
                        limit: users.length,
                        total: users.length,
                        pages: 1
                    },
                    lastUpdated: new Date()
                }
            };
        } catch (error) {
            console.error('Error in AdminStatsService.getUserStats:', error);
            throw error;
        }
    }

    static async getServiceStats() {
        try {
            const stats = await this.getUnifiedStats();
            const services = await DichVu.find({})
                .populate('NguoiTao', 'name email')
                .populate('ThanhVien', 'name email')
                .sort({ createdAt: -1 })
                .lean();
            
            return {
                success: true,
                data: {
                    services: services,
                    statistics: stats.services,
                    pagination: {
                        page: 1,
                        limit: services.length,
                        total: services.length,
                        pages: 1
                    },
                    lastUpdated: new Date()
                }
            };
        } catch (error) {
            console.error('Error in AdminStatsService.getServiceStats:', error);
            throw error;
        }
    }

    static async getTransactionStats() {
        try {
            const stats = await this.getUnifiedStats();
            const transactions = await GiaoDich.find({})
                .populate('NguoiThamGia', 'name email')
                .sort({ NgayGiaoDich: -1 })
                .lean();
            
            return {
                success: true,
                data: {
                    transactions: transactions,
                    statistics: stats.transactions,
                    pagination: {
                        page: 1,
                        limit: transactions.length,
                        total: transactions.length,
                        pages: 1
                    },
                    lastUpdated: new Date()
                }
            };
        } catch (error) {
            console.error('Error in AdminStatsService.getTransactionStats:', error);
            throw error;
        }
    }

    static async getMemberStats() {
        try {
            const stats = await this.getUnifiedStats();
            const members = await Member.find({})
                .populate('UserId', 'name email')
                .sort({ NgayTao: -1 })
                .lean();
            
            return {
                success: true,
                data: {
                    members: members,
                    statistics: stats.members,
                    pagination: {
                        page: 1,
                        limit: members.length,
                        total: members.length,
                        pages: 1
                    },
                    lastUpdated: new Date()
                }
            };
        } catch (error) {
            console.error('Error in AdminStatsService.getMemberStats:', error);
            throw error;
        }
    }
}

module.exports = AdminStatsService;
