import axios from 'axios';

// Example implementation using UltraMsg API (or generic WhatsApp REST API)
// For Twilio, you would use the twilio library
export const sendWhatsAppReminder = async (phone, message) => {
  try {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    
    if (!instanceId || !token) {
      console.warn('WhatsApp API credentials missing. Simulating sending reminder to:', phone);
      console.log('Message:', message);
      return true; 
    }

    // Format phone number to international format, e.g. +91XXXXXXXXXX
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    
    const response = await axios.post(url, {
      token: token,
      to: formattedPhone,
      body: message
    });

    if (response.data && response.data.sent) {
      console.log(`WhatsApp reminder sent to ${formattedPhone}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    return false;
  }
};
