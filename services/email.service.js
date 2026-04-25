import nodemailer from 'nodemailer';
import crypto from 'crypto';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const from = () =>
  `"${process.env.SMTP_FROM_NAME || 'SiteLeader'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;

export const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

export const sendEmailVerification = async (user) => {
  const token = generateVerificationToken();
  user.emailVerificationToken = token;
  await user.save();

  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}&uid=${user._id}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
      <h2 style="color:#1976d2">Verify Your Email — SiteLeader</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
      <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1976d2;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold">Verify Email</a>
      <p style="color:#666;font-size:12px">If you didn't create a SiteLeader account, ignore this email.</p>
    </div>
  `;

  await createTransporter().sendMail({
    from: from(),
    to: user.email,
    subject: 'Verify Your Email — SiteLeader',
    html,
  });
};

export const sendBuilderRegistrationNotice = async (user) => {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
      <h2 style="color:#1976d2">New Builder Registration — SiteLeader</h2>
      <p>A new builder has registered and is pending approval.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${user.name}</td></tr>
        <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${user.email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Registered At</td><td style="padding:8px">${new Date().toLocaleString()}</td></tr>
      </table>
      <p style="margin-top:16px">Login to the admin panel to approve or deny this registration.</p>
    </div>
  `;

  await createTransporter().sendMail({
    from: from(),
    to: adminEmail,
    subject: 'New Builder Registration Pending Approval',
    html,
  });
};

export const sendApprovalEmail = async (user) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
      <h2 style="color:#2e7d32">Account Approved — SiteLeader</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your SiteLeader account has been <strong>approved</strong>. You can now log in and start managing your sites.</p>
      <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2e7d32;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold">Login Now</a>
    </div>
  `;

  await createTransporter().sendMail({
    from: from(),
    to: user.email,
    subject: 'Your SiteLeader Account is Approved',
    html,
  });
};

export const sendDenialEmail = async (user, reason) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
      <h2 style="color:#c62828">Account Not Approved — SiteLeader</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Unfortunately, your SiteLeader account registration has been <strong>denied</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this is a mistake, please contact support.</p>
    </div>
  `;

  await createTransporter().sendMail({
    from: from(),
    to: user.email,
    subject: 'SiteLeader Account Registration Update',
    html,
  });
};
