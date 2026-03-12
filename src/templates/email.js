export const emailVerificationTemplate = ({
  name,
  otp,
  appName = "CareerNav",
  supportEmail = "support@careernav.in"
}) => {
  return {
    subject: `${appName} – Verify your email address`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:20px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:22px;">${appName}</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#d1d5db;">
                Navigate your career with clarity
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;color:#1f2937;">
              <p style="font-size:16px;">Hi ${name || "there"},</p>

              <p style="font-size:15px;line-height:1.6;">
                Welcome to <strong>${appName}</strong>.
                To complete your registration, please verify your email address using the code below:
              </p>

              <div style="margin:32px 0;text-align:center;">
                <span style="
                  display:inline-block;
                  padding:14px 28px;
                  font-size:24px;
                  letter-spacing:6px;
                  background:#f3f4f6;
                  border-radius:6px;
                  font-weight:bold;
                  color:#111827;
                ">
                  ${otp}
                </span>
              </div>

              <p style="font-size:14px;color:#374151;">
                This verification code will expire in <strong>10 minutes</strong>.
                If you didn’t request this, you can safely ignore this email.
              </p>

              <p style="font-size:14px;color:#374151;">
                Need help? Contact us at
                <a href="mailto:${supportEmail}" style="color:#2563eb;">
                  ${supportEmail}
                </a>
              </p>

              <p style="margin-top:32px;font-size:14px;">
                Regards,<br/>
                <strong>${appName} Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#6b7280;">
              © ${new Date().getFullYear()} ${appName}. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
    text: `
Hi ${name || "there"},

Welcome to ${appName}!

Your email verification code is: ${otp}

This code will expire in 10 minutes.
If you didn’t request this, please ignore this email.

Need help? Contact us at ${supportEmail}

– ${appName} Team
`
  };
};
