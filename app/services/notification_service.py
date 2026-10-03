import asyncio

from twilio.rest import Client
from twilio.twiml.voice_response import Say, VoiceResponse

from app.core.config import settings


def _twilio_client() -> Client:
    if not settings.twilio_account_sid or settings.twilio_auth_token is None:
        raise RuntimeError("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured")
    return Client(settings.twilio_account_sid, settings.twilio_auth_token.get_secret_value())


async def trigger_supervisor_voice_call(to_phone: str, message_hindi: str) -> str:
    if not settings.twilio_from_phone:
        raise RuntimeError("TWILIO_FROM_PHONE must be configured")
    response = VoiceResponse()
    response.append(Say(message_hindi, language="hi-IN", voice="Polly.Aditi"))
    twiml = str(response)

    def dispatch() -> str:
        call = _twilio_client().calls.create(
            to=to_phone,
            from_=settings.twilio_from_phone,
            twiml=twiml,
        )
        return str(call.sid)

    return await asyncio.to_thread(dispatch)


async def send_whatsapp_alert(to_phone: str, alert_text: str) -> str:
    recipient = to_phone if to_phone.startswith("whatsapp:") else f"whatsapp:{to_phone}"

    def dispatch() -> str:
        message = _twilio_client().messages.create(
            from_=settings.twilio_whatsapp_from,
            to=recipient,
            body=alert_text,
        )
        return str(message.sid)

    return await asyncio.to_thread(dispatch)