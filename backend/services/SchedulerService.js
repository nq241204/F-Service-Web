// services/SchedulerService.js
// Service để lên lịch các tác vụ tự động

const TransactionAutoConfirmService = require('./TransactionAutoConfirmService');

class SchedulerService {
    constructor() {
        this.isRunning = false;
        this.interval = null;
    }

    // Khởi động scheduler - tự động xác nhận giao dịch
    start(intervalSeconds = 60) {
        if (this.isRunning) {
            console.log('[Scheduler] Already running');
            return;
        }

        this.isRunning = true;
        console.log(`[Scheduler] Starting auto-confirm service (interval: ${intervalSeconds}s)`);

        // Chạy lần đầu sau 10 giây
        setTimeout(() => {
            this.processTransactions();
        }, 10000);

        // Chạy định kỳ
        this.interval = setInterval(() => {
            this.processTransactions();
        }, intervalSeconds * 1000);
    }

    // Dừng scheduler
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        console.log('[Scheduler] Stopped');
    }

    // Xử lý giao dịch pending
    async processTransactions() {
        try {
            // Xác nhận giao dịch đã pending quá 5 phút
            const result = await TransactionAutoConfirmService.processAllPendingTransactions(5);
            
            if (result.success > 0 || result.failed > 0) {
                console.log(`[Scheduler] Processed transactions: ${result.success} confirmed, ${result.failed} failed`);
            }

            // Hủy giao dịch pending quá 24 giờ
            const cancelResult = await TransactionAutoConfirmService.cancelStaleTransactions(24);
            if (cancelResult.cancelled > 0) {
                console.log(`[Scheduler] Cancelled ${cancelResult.cancelled} stale transactions, refunded ${cancelResult.refunded}`);
            }
        } catch (error) {
            console.error('[Scheduler] Error processing transactions:', error);
        }
    }

    // Kiểm tra trạng thái
    isActive() {
        return this.isRunning;
    }
}

// Singleton instance
const scheduler = new SchedulerService();

module.exports = scheduler;
