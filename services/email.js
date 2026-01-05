const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

async function sendContact(body) {
  const to = process.env.SMTP_FROM || (process.env.SMTP_USER || 'no-reply@example.com');
  const mail = {
    from: body.email || to,
    to: to,
    subject: body.subject || 'Contact form',
    text: body.message || JSON.stringify(body)
  };
  return transporter.sendMail(mail);
}

module.exports = { sendContact };
