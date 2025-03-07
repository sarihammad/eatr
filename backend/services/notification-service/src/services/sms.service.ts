import twilio from "twilio";

interface SMSOptions {
  to: string;
  message: string;
}

export class SMSService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSMS(options: SMSOptions) {
    try {
      await this.client.messages.create({
        body: options.message,
        to: options.to,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
      throw error;
    }
  }
}
