import { resend } from "../../config/mail.js";

export const sendActivationEmail = async (email, token) => {
 const link = `${process.env.APP_URL}/activate?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Activa tu cuenta",
    html: `
      <h2>Activación de cuenta</h2>
      <p>Haz clic para activar:</p>
      <a href="${link}">${link}</a>
      <p>Este link expira en 15 minutos</p>
    `,
  });
};

export const sendResetEmail = async (email, token) => {
  const link = `${process.env.APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Restablecer contraseña",
    html: `
      <h2>Restablecer contraseña</h2>
      <p>Haz clic en el enlace:</p>
      <a href="${link}">${link}</a>
      <p>Este enlace expira en 15 minutos</p>
    `,
  });
};