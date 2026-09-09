import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_via_resend(to_email: str, subject: str, body_text: str, body_html: Optional[str]) -> bool:
    """Send email via Resend HTTP API — works on Render free tier where SMTP is blocked."""
    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        params = {
            "from": settings.SMTP_SENDER or "Briefen <noreply@briefen.ai>",
            "to": [to_email],
            "subject": subject,
            "text": body_text,
        }
        if body_html:
            params["html"] = body_html
        resend.Emails.send(params)
        logger.info(f"Email dispatched via Resend to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Resend email dispatch failed to {to_email}: {e}")
        return False


def _send_via_smtp(to_email: str, subject: str, body_text: str, body_html: Optional[str]) -> bool:
    """Send email via SMTP (blocking) — runs in thread executor."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_SENDER
        msg["To"] = to_email
        msg.attach(MIMEText(body_text, "plain"))
        if body_html:
            msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], [to_email], msg.as_string())

        logger.info(f"Transactional notification dispatched via SMTP to {to_email}")
        return True
    except Exception as smtp_err:
        logger.error(f"SMTP dispatch failed to {to_email}: {smtp_err}")
        return False


async def send_email_notification(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
) -> bool:
    """
    Dispatches transactional emails. Priority:
    1. Resend HTTP API (if RESEND_API_KEY is set) — works on Render free tier
    2. SMTP via Gmail (if SMTP_USER + SMTP_PASSWORD are set) — blocked on Render free tier
    3. Log-only simulation (if neither is configured)
    """
    # Priority 1: Resend HTTP API
    if settings.RESEND_API_KEY:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, _send_via_resend, to_email, subject, body_text, body_html
        )

    # Priority 2: SMTP (works locally, blocked on Render free tier)
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, _send_via_smtp, to_email, subject, body_text, body_html
        )

    # Priority 3: Log-only simulation
    logger.info(
        f"\n"
        f"====== SIMULATED OUTBOX DISPATCH ======\n"
        f"To: {to_email}\n"
        f"Subject: {subject}\n"
        f"Body:\n{body_text}\n"
        f"======================================="
    )
    return True
