import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true, // 👈 IMPORTANTE
});

const test = async () => {
  try {
    console.log("🔵 Enviando correo...");

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: "Test SMTP ✔",
      text: "Si ves esto, SMTP funciona 🚀",
    });

    console.log("🟢 CORREO ENVIADO:", info.messageId);
  } catch (error) {
    console.log("🔴 ERROR COMPLETO:");
    console.log(error);
  }
};

test();