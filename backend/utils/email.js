// utils/email.js
// Lightweight email sender fallback. If SMTP config is provided, this can be extended to use nodemailer.
const logger = require('../config/logger');

module.exports = async function sendEmail({ email, subject, html }) {
  // If real email transport is not configured, just log the email for now.
  logger.info(`sendEmail -> to=${email} subject=${subject}`);
  // In production, integrate nodemailer or a transactional email service here.
  return Promise.resolve();
};
