export interface PaymentService {
  processPayment(paymentData: PaymentData): Promise<PaymentResult>
  refundPayment(transactionId: string, amount: number): Promise<RefundResult>
}

export interface PaymentData {
  amount: number
  currency: string
  customerEmail: string
  orderId: string
  metadata?: Record<string, unknown>
}

export interface PaymentResult {
  success: boolean
  transactionId: string
  message: string
  error?: string
}

export interface RefundResult {
  success: boolean
  refundId: string
  message: string
  error?: string
}

class MockPaymentService implements PaymentService {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    console.log('💳 [MOCK PAYMENT] Processing Payment')
    console.log(`Amount: $${paymentData.amount.toFixed(2)} ${paymentData.currency}`)
    console.log(`Customer: ${paymentData.customerEmail}`)
    console.log(`Order ID: ${paymentData.orderId}`)
    console.log('---')

    const simulateFailure = Math.random() < 0.05

    await new Promise(resolve => setTimeout(resolve, 1000))

    if (simulateFailure) {
      return {
        success: false,
        transactionId: '',
        message: 'Payment failed',
        error: 'Insufficient funds or card declined',
      }
    }

    return {
      success: true,
      transactionId: `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Payment processed successfully',
    }
  }

  async refundPayment(transactionId: string, amount: number): Promise<RefundResult> {
    console.log('💰 [MOCK REFUND] Processing Refund')
    console.log(`Transaction ID: ${transactionId}`)
    console.log(`Amount: $${amount.toFixed(2)}`)
    console.log('---')

    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      success: true,
      refundId: `mock_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Refund processed successfully',
    }
  }
}

export const paymentService: PaymentService = new MockPaymentService()
