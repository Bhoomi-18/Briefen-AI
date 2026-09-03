import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email_notification(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None
) -> bool:
    """Dispatches transactional notification alerts via SMTP, falling back to logging simulated emails."""
    smtp_server = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_pass = settings.SMTP_PASSWORD
    
    # 1. Fallback Mock Log if username/password credentials are blank
    if not smtp_user or not smtp_pass:
        logger.info(
            f"\n"
            f"====== SIMULATED OUTBOX DISPATCH ======\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"Body:\n{body_text}\n"
            f"======================================="
        )
        return True

    # 2. SMTP dispatch connection
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_SENDER
        msg["To"] = to_email
        
        msg.attach(MIMEText(body_text, "plain"))
        if body_html:
            msg.attach(MIMEText(body_html, "html"))
            
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(msg["From"], [to_email], msg.as_string())
            
        logger.info(f"Transactional notification dispatched successfully to {to_email}")
        return True
    except Exception as smtp_err:
        logger.error(f"Failed to dispatch SMTP email notification to {to_email}: {str(smtp_err)}")
        return False
