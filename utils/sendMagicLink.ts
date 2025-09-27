import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMagicLink = async (email: string, token: string) => {
  const link = `http://synq-lime.vercel.app/onboard/set-workspace?token=${token}`; 
  // Backwards compatibility: if a full URL is passed in, use it directly; else treat it as a raw token
  const magicLinkUrl = token.startsWith("http") ? token : `http://`;

  const preheader = "Secure one-click sign-in. This link expires in 15 minutes.";
  const brandColor = "#6C5CE7"; // Synq brand accent
  const textColor = "#0F172A"; // slate-900
  const mutedColor = "#475569"; // slate-600
  const borderColor = "#E2E8F0"; // slate-200
  const bgColor = "#F8FAFC"; // slate-50

  const html = `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Sign in to Synq</title>
    <style>
      /* Reset */
      body,table,td,a{ -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
      table,td{ mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse !important; }
      img{ -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
      body{ margin:0 !important; padding:0 !important; width:100% !important; background:${bgColor}; }
      a{ color:${brandColor}; text-decoration:none; }
      .hover-underline:hover{ text-decoration:underline !important; }
      @media (prefers-color-scheme: dark){
        body{ background:#0B1220 !important; }
        .card{ background:#0F172A !important; border-color:#1F2937 !important; }
        .text{ color:#E5E7EB !important; }
        .muted{ color:#9CA3AF !important; }
        .btn{ color:#111827 !important; }
        .divider{ border-color:#1F2937 !important; }
      }
      @media screen and (max-width: 600px){
        .container{ padding:16px !important; }
        .card{ padding:20px !important; }
        .logo{ font-size:18px !important; }
        .btn{ padding:14px 18px !important; font-size:16px !important; }
      }
    </style>
  </head>
  <body>
    <div style="display:none;opacity:0;color:transparent;visibility:hidden;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${bgColor}; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" class="container" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; padding:0 24px;">
            <tr>
              <td style="padding-bottom:16px;" align="left">
                <div class="logo" style="font-family:Inter,Segoe UI,Roboto,Arial,sans-serif; font-weight:700; font-size:20px; color:${textColor};">
                  <span style="display:inline-block; width:10px; height:10px; background:${brandColor}; border-radius:2px; margin-right:8px;"></span>
                  Synq
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" width="100%" class="card" style="background:#FFFFFF; border:1px solid ${borderColor}; border-radius:16px; padding:28px;">
                  <tr>
                    <td align="left">
                      <h1 class="text" style="margin:0 0 8px 0; font-family:Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:22px; line-height:30px; color:${textColor};">One-click sign in</h1>
                      <p class="muted" style="margin:0 0 20px 0; font-family:Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:14px; line-height:22px; color:${mutedColor};">Tap the button below to securely sign in to your Synq account. This link expires in 15 minutes.</p>

                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 8px 0 20px 0;">
                        <tr>
                          <td bgcolor="${brandColor}" style="border-radius:12px;">
                            <a href="${magicLinkUrl}" target="_blank" class="btn" style="display:inline-block; font-family:Inter,Segoe UI,Roboto,Arial,sans-serif; color:#FFFFFF; background:${brandColor}; padding:16px 22px; border-radius:12px; font-weight:600; font-size:17px; letter-spacing:0.2px;">Sign in to Synq</a>
                          </td>
                        </tr>
                      </table>

                      <p class="muted" style="margin:0 0 8px 0; font-family:Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:13px; line-height:20px; color:${mutedColor};">If the button doesn’t work, copy and paste this URL into your browser:</p>
                      <p style="margin:0 0 16px 0; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:12px; line-height:20px; color:${textColor}; word-break:break-all;">${magicLinkUrl}</p>

                      <hr class="divider" style="border:none; border-top:1px solid ${borderColor}; margin:20px 0;" />

                      <p class="muted" style="margin:0; font-family:Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:12px; line-height:20px; color:${mutedColor};">Didn’t request this email? You can safely ignore it. Your account is still secure.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 8px 0 8px;">
                <p class="muted" style="margin:0; font-family:Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:12px; color:${mutedColor};">© ${new Date().getFullYear()} Synq • <a class="hover-underline" href="https://synq.example" style="color:${mutedColor};">synq.example</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"Synq" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your secure magic link to sign in",
    html,
    text: `Sign in to Synq: ${magicLinkUrl}\n\nThis link expires in 15 minutes. If you didn’t request this, just ignore this email.`,
  });
};
