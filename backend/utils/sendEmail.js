const nodemailer = require('nodemailer');
const log = require('./logger');

/**
 * Returns SMTP settings from dynamic DB config or fallback ENV.
 */
function getSmtpSettings() {
  const cfg = global.SystemEnv || {};

  const host = cfg.SMTP_HOST || process.env.SMTP_HOST;
  const port = Number(cfg.SMTP_PORT || process.env.SMTP_PORT);
  const user = cfg.SMTP_EMAIL || process.env.SMTP_EMAIL;
  const pass = cfg.SMTP_PASSWORD || process.env.SMTP_PASSWORD;
  const secure = String(cfg.SMTP_SECURE || process.env.SMTP_SECURE || "false") === "true";

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration is incomplete");
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  };
}

/**
 * Sends Email Using Dynamic SMTP
 */
const sendEmail = async (options) => {
  if (!options || typeof options !== "object") {
    throw new Error("Email options are required");
  }

  if (!options.email || !options.subject || !options.message) {
    throw new Error("Email payload must include email, subject, and message");
  }

  const smtpConfig = getSmtpSettings();

  const transporter = nodemailer.createTransport(smtpConfig);

  const mailOptions = {
    from: `"AiSuite Support" <${smtpConfig.auth.user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
  log("INFO", `Email sent to ${options.email}`);
};

module.exports = sendEmail;
