export interface EmailService {
  sendOrderConfirmation(to: string, orderDetails: OrderConfirmationData): Promise<void>
  sendOrderStatusUpdate(to: string, orderData: OrderStatusUpdateData): Promise<void>
  sendWelcomeEmail(to: string, name: string): Promise<void>
}

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

class MockEmailService implements EmailService {
  async sendOrderConfirmation(to: string, orderDetails: OrderConfirmationData): Promise<void> {
    console.log('📧 [MOCK EMAIL] Order Confirmation')
    console.log(`To: ${to}`)
    console.log(`Order Number: ${orderDetails.orderNumber}`)
    console.log(`Customer: ${orderDetails.customerName}`)
    console.log(`Total: $${orderDetails.total.toFixed(2)}`)
    console.log(`Delivery Date: ${orderDetails.deliveryDate}`)
    console.log('---')
  }

  async sendOrderStatusUpdate(to: string, orderData: OrderStatusUpdateData): Promise<void> {
    console.log('📧 [MOCK EMAIL] Order Status Update')
    console.log(`To: ${to}`)
    console.log(`Order Number: ${orderData.orderNumber}`)
    console.log(`Status: ${orderData.status}`)
    console.log('---')
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    console.log('📧 [MOCK EMAIL] Welcome Email')
    console.log(`To: ${to}`)
    console.log(`Name: ${name}`)
    console.log('---')
  }
}

export const emailService: EmailService = new MockEmailService()
