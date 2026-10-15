import nodemailer from "nodemailer";

export function mailReady() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendFollowup({ to, name, message, report }) {
  if (!mailReady() || !to) return "drafted";
  try {
    const t = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;line-height:1.55;color:#222">
      <p>${escape(message).replace(/\n/g, "<br>")}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <p style="color:#666;font-size:13px">Your Plan B report:</p>
      <div style="font-size:14px">${escape(report || "").replace(/^## (.*)$/gm, "<h3 style='margin:16px 0 4px'>$1</h3>").replace(/\n/g, "<br>")}</div>
      <p style="margin-top:24px"><a href="https://www.niatindia.com/" style="background:#1f6f5c;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Book free NAT counselling</a></p>
    </div>`;
    await t.sendMail({
      from: `"Plan B Navigator" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${name}, your JEE Plan B report`,
      text: `${message}\n\n${report || ""}`,
      html,
    });
    return "sent";
  } catch (e) {
    console.error("mail failed", e.message);
    return "failed";
  }
}

function escape(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
