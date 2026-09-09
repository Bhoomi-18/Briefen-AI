import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_email_sync(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str],
) -> bool:
    """Synchronous SMTP send — runs in a thread executor to avoid blocking the event loop."""
    smtp_server = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_pass = settings.SMTP_PASSWORD

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_SENDER
        msg["To"] = to_email

        msg.attach(MIMEText(body_text, "plain"))
        if body_html:
            msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(msg["From"], [to_email], msg.as_string())

        logger.info(f"Transactional notification dispatched successfully to {to_email}")
        return True
    except Exception as smtp_err:
        logger.error(f"Failed to dispatch SMTP email notification to {to_email}: {smtp_err}")
        return False


async def send_email_notification(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
) -> bool:
    """Dispatches transactional notification alerts via SMTP, falling back to logging simulated emails."""
    smtp_user = settings.SMTP_USER
    smtp_pass = settings.SMTP_PASSWORD

    # Fallback: log-only mode if SMTP credentials are blank
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

    # Run blocking SMTP call in a thread so the event loop is never frozen
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _send_email_sync, to_email, subject, body_text, body_html
    )
