/**
 * Email Service (Mock Implementation)
 *
 * This is a mock email service that logs emails to console.
 * For production, replace with a real email provider like:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - Resend
 */

export interface EmailOptions {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EmailService {
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    console.log('='.repeat(50))
    console.log('📧 MOCK EMAIL SERVICE')
    console.log('='.repeat(50))
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`Template: ${options.template}`)
    console.log(`Data: ${JSON.stringify(options.data, null, 2)}`)
    console.log('='.repeat(50))

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  // Legacy methods for backwards compatibility
  async sendOrderConfirmation(to: string, orderDetails: OrderConfirmationData): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Order Confirmation - #${orderDetails.orderNumber}`,
      template: 'orderConfirmation',
      data: orderDetails,
    })
  }

  async sendOrderStatusUpdate(to: string, orderData: OrderStatusUpdateData): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Order #${orderData.orderNumber} - Status Update`,
      template: 'orderStatusUpdate',
      data: orderData,
    })
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to Cake Shop!',
      template: 'welcome',
      data: { name },
    })
  }
}

// Legacy interfaces for backwards compatibility
export interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  deliveryDate: string
  deliveryAddress?: string
}

export interface OrderStatusUpdateData {
  orderNumber: string
  customerName: string
  status: string
}

// Export singleton instance
export const emailService = new EmailService()
