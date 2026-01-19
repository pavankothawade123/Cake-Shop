/**
 * SMS Service (Mock Implementation)
 *
 * This is a mock SMS service that logs messages to console.
 * For production, replace with a real SMS provider like:
 * - MSG91 (India)
 * - Twilio
 * - AWS SNS
 * - Textlocal
 */

export interface SmsMessage {
  to: string
  body: string
}

export interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
}

class MockSmsService {
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '')
    // If it doesn't start with country code, assume India (+91)
    if (digits.length === 10) {
      return `+91${digits}`
    }
    return digits.startsWith('+') ? phone : `+${digits}`
  }

  async send(message: SmsMessage): Promise<SmsResult> {
    const formattedPhone = this.formatPhoneNumber(message.to)

    console.log('='.repeat(50))
    console.log('MOCK SMS SERVICE')
    console.log('='.repeat(50))
    console.log(`To: ${formattedPhone}`)
    console.log(`Message: ${message.body}`)
    console.log('='.repeat(50))

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Return success with mock message ID
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  async sendBulk(messages: SmsMessage[]): Promise<SmsResult[]> {
    return Promise.all(messages.map((m) => this.send(m)))
  }
}

// Export singleton instance
export const smsService = new MockSmsService()

// Helper functions for common SMS notifications
export async function sendOrderConfirmationSms(
  phone: string,
  orderNumber: string,
  total: number
): Promise<SmsResult> {
  return smsService.send({
    to: phone,
    body: `Your order #${orderNumber} for Rs.${total.toFixed(2)} has been placed successfully. We'll notify you when it's ready!`,
  })
}

export async function sendOrderStatusUpdateSms(
  phone: string,
  orderNumber: string,
  status: string
): Promise<SmsResult> {
  const statusMessages: Record<string, string> = {
    CONFIRMED: `Your order #${orderNumber} has been confirmed! We're preparing your cake.`,
    BAKING: `Your order #${orderNumber} is being baked with love!`,
    OUT_FOR_DELIVERY: `Your order #${orderNumber} is out for delivery. Get ready!`,
    DELIVERED: `Your order #${orderNumber} has been delivered. Enjoy your cake!`,
    CANCELLED: `Your order #${orderNumber} has been cancelled. Please contact us if you have questions.`,
  }

  const message = statusMessages[status] || `Order #${orderNumber} status: ${status}`

  return smsService.send({
    to: phone,
    body: message,
  })
}

export async function sendAdminNewOrderSms(
  phone: string,
  orderNumber: string,
  customerName: string
): Promise<SmsResult> {
  return smsService.send({
    to: phone,
    body: `New order #${orderNumber} from ${customerName}. Please check admin panel.`,
  })
}
