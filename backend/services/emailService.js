const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendSigningLink(toEmail, docName, signingUrl) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `Please sign: ${docName}`,
    html: `
      <h2>You have a document to sign</h2>
      <p>Please review and sign <strong>${docName}</strong></p>
      <a href="${signingUrl}" style="background:#2563eb;color:white;
        padding:10px 20px;border-radius:6px;text-decoration:none;">
        Sign Document
      </a>
      <p style="color:#999;font-size:12px;margin-top:20px;">
        This link expires in 7 days.
      </p>
    `
  });
}

module.exports = { sendSigningLink };
Step 3 — Create the send invite route