import os

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")


def send_otp_sms(phone: str, code: str) -> None:
    """Send a login code to `phone`. Uses Twilio when credentials are configured;
    otherwise falls back to logging the code so local/dev environments work
    without a real SMS provider."""
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER:
        from twilio.rest import Client

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=f"Your Property Management login code is {code}. It expires in 5 minutes.",
            from_=TWILIO_FROM_NUMBER,
            to=phone,
        )
    else:
        print(f"[DEV SMS] OTP for {phone}: {code}")
