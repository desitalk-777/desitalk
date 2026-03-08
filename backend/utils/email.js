const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const templates = {
  emailVerification: (data) => ({
    subject: 'Welcome to DesiTalk! Verify Your Email 🎉',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f10; color: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 800;">🇮🇳 DesiTalk</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">India's Discussion Platform</p>
        </div>
        <div style="padding: 40px;">
          <h2>Namaste, ${data.name}! 🙏</h2>
          <p>Welcome to DesiTalk! Please verify your email to get started.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.verifyUrl}" style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
              ✅ Verify Email
            </a>
          </div>
          <p style="color: #888; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `
  }),
  passwordReset: (data) => ({
    subject: 'DesiTalk - Password Reset Request 🔐',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f10; color: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 800;">🇮🇳 DesiTalk</h1>
        </div>
        <div style="padding: 40px;">
          <h2>Hi ${data.name},</h2>
          <p>We received a request to reset your password. Click below to create a new one.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.resetUrl}" style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
              🔐 Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore and your password will remain unchanged.</p>
        </div>
      </div>
    `
  })
};

exports.sendEmail = async ({ to, subject, template, data, html }) => {
  const templateData = template && templates[template] ? templates[template](data) : { subject, html };

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: templateData.subject || subject,
    html: templateData.html || html
  };

  await transporter.sendMail(mailOptions);
};
