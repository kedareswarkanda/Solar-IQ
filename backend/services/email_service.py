"""
SolarIQ Real SMTP Email Service Module
Sends real 6-digit verification OTP emails to user inboxes using SMTP configuration.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple

class EmailService:
    def __init__(self):
        pass

    def get_smtp_config(self):
        host = os.getenv("SMTP_HOST", "").strip()
        port = int(os.getenv("SMTP_PORT", "587").strip() or "587")
        username = os.getenv("SMTP_USERNAME", "").strip()
        password = os.getenv("SMTP_PASSWORD", "").strip()
        from_email = os.getenv("SMTP_FROM", "").strip() or username or "noreply@solariq.io"
        use_tls = os.getenv("SMTP_USE_TLS", "true").strip().lower() in ("true", "1", "yes")
        return host, port, username, password, from_email, use_tls

    def is_email_configured(self) -> bool:
        host, port, username, password, from_email, use_tls = self.get_smtp_config()
        return bool(host and username and password)

    def send_otp_email(self, to_email: str, otp_code: str) -> Tuple[bool, str]:
        """
        Sends a real 6-digit OTP verification email to the user's inbox.
        Returns (success: bool, message: str).
        """
        if not self.is_email_configured():
            return False, "Email service is not configured. Please configure SMTP credentials in .env to send OTP emails."

        host, port, username, password, from_email, use_tls = self.get_smtp_config()

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "SolarIQ Email Verification Code"
            msg["From"] = from_email
            msg["To"] = to_email

            text_content = f"""Hello,

Your SolarIQ verification code is:

{otp_code}

This code expires in 5 minutes.

If you did not request this verification, you can ignore this email.

SolarIQ Team
https://solariq.io
"""

            html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FBF3EA; color: #4A3030; margin: 0; padding: 20px; }}
    .container {{ max-width: 500px; margin: 0 auto; background-color: #FFFDFC; border: 1px solid #EED6CC; border-radius: 20px; padding: 30px; box-shadow: 0 4px 12px rgba(74,48,48,0.05); }}
    .logo {{ text-align: center; font-size: 28px; font-weight: 900; color: #4A3030; margin-bottom: 20px; }}
    .logo span {{ color: #8F2635; }}
    .code-box {{ background-color: #FBE1E1; border: 2px border #E86A6A; border-radius: 14px; text-align: center; padding: 18px; margin: 24px 0; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #8F2635; }}
    .footer {{ text-align: center; font-size: 11px; color: #8F2635; margin-top: 30px; border-top: 1px solid #EED6CC; padding-top: 15px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Solar<span>IQ</span></div>
    <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #4A3030;">Verify Your Email Address</h3>
    <p style="margin: 0; font-size: 13px; color: #4A3030; line-height: 1.5;">Please use the 6-digit code below to complete your account registration:</p>
    <div class="code-box">{otp_code}</div>
    <p style="margin: 0; font-size: 12px; color: #8F2635; font-weight: 600;">⏱️ This verification code expires in 5 minutes.</p>
    <p style="margin-top: 15px; font-size: 12px; color: #4A3030/70;">If you did not request this code, you can safely ignore this email.</p>
    <div class="footer">SolarIQ • AI + Physics Photovoltaic Efficiency Platform</div>
  </div>
</body>
</html>
"""

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=15)
            else:
                server = smtplib.SMTP(host, port, timeout=15)
                if use_tls:
                    server.starttls()

            server.login(username, password)
            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()

            return True, f"OTP sent successfully to {to_email}."
        except smtplib.SMTPAuthenticationError:
            return False, "SMTP Authentication Failed. Please check SMTP_USERNAME and SMTP_PASSWORD in .env."
        except smtplib.SMTPConnectError:
            return False, "Unable to connect to SMTP server. Please check SMTP_HOST and SMTP_PORT in .env."
        except Exception as e:
            return False, f"Email delivery error: {str(e)}"

email_service = EmailService()
