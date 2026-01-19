/**
 * Notification Service
 *
 * Orchestrates email and SMS notifications for various events.
 * This service handles all outbound notifications to customers and admins.
 */

import { EmailService } from './email.service'
import {
  smsService,
  sendOrderConfirmationSms,
  sendOrderStatusUpdateSms,
  sendAdminNewOrderSms,
} from './sms.service'

const emailService = new EmailService()

// Admin notification settings (can be moved to env/config)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PHONE = process.env.ADMIN_PHONE || ''

export interface OrderNotificationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  total: number
  items: Array<{
    productName: string
    quantity: number
    price: number
    customization?: {
      size: string
      nameOnCake?: string
      designInstructions?: string
    }
  }>
  deliveryDate: Date
  deliveryAddress?: string
  deliveryMethod: 'DELIVERY' | 'PICKUP'
}

export interface StatusUpdateData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  newStatus: string
  previousStatus?: string
}

export interface ReviewRequestData {
  customerName: string
  customerEmail: string
  orderNumber: string
  products: Array<{
    name: string
    slug: string
  }>
}

export interface LoyaltyNotificationData {
  customerName: string
  customerEmail: string
  pointsEarned: number
  totalPoints: number
  orderNumber: string
}

class NotificationService {
  /**
   * Send notifications when a new order is placed
   */
  async onOrderPlaced(data: OrderNotificationData): Promise<void> {
    const promises: Promise<any>[] = []

    // Send customer email
    try {
      promises.push(
        emailService.sendEmail({
          to: data.customerEmail,
          subject: `Order Confirmation - #${data.orderNumber}`,
          template: 'orderConfirmation',
          data: {
            customerName: data.customerName,
            orderNumber: data.orderNumber,
            items: data.items,
            total: data.total,
            deliveryDate: data.deliveryDate,
            deliveryMethod: data.deliveryMethod,
            deliveryAddress: data.deliveryAddress,
          },
        })
      )
    } catch (error) {
      console.error('Failed to send order confirmation email:', error)
    }

    // Send customer SMS
    if (data.customerPhone) {
      promises.push(
        sendOrderConfirmationSms(data.customerPhone, data.orderNumber, data.total).catch((error) =>
          console.error('Failed to send order confirmation SMS:', error)
        )
      )
    }

    // Send admin email notification
    promises.push(
      emailService
        .sendEmail({
          to: ADMIN_EMAIL,
          subject: `New Order #${data.orderNumber} from ${data.customerName}`,
          template: 'adminNewOrder',
          data: {
            orderNumber: data.orderNumber,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            items: data.items,
            total: data.total,
            deliveryDate: data.deliveryDate,
            deliveryMethod: data.deliveryMethod,
            deliveryAddress: data.deliveryAddress,
          },
        })
        .catch((error) => console.error('Failed to send admin notification email:', error))
    )

    // Send admin SMS if configured
    if (ADMIN_PHONE) {
      promises.push(
        sendAdminNewOrderSms(ADMIN_PHONE, data.orderNumber, data.customerName).catch((error) =>
          console.error('Failed to send admin notification SMS:', error)
        )
      )
    }

    await Promise.allSettled(promises)
  }

  /**
   * Send notifications when order status changes
   */
  async onOrderStatusUpdate(data: StatusUpdateData): Promise<void> {
    const promises: Promise<any>[] = []

    // Send customer email
    promises.push(
      emailService
        .sendEmail({
          to: data.customerEmail,
          subject: `Order #${data.orderNumber} - Status Update`,
          template: 'orderStatusUpdate',
          data: {
            customerName: data.customerName,
            orderNumber: data.orderNumber,
            status: data.newStatus,
            previousStatus: data.previousStatus,
          },
        })
        .catch((error) => console.error('Failed to send status update email:', error))
    )

    // Send customer SMS
    if (data.customerPhone) {
      promises.push(
        sendOrderStatusUpdateSms(data.customerPhone, data.orderNumber, data.newStatus).catch(
          (error) => console.error('Failed to send status update SMS:', error)
        )
      )
    }

    await Promise.allSettled(promises)
  }

  /**
   * Send review request after order is delivered
   */
  async sendReviewRequest(data: ReviewRequestData): Promise<void> {
    try {
      await emailService.sendEmail({
        to: data.customerEmail,
        subject: `How was your cake? Share your feedback!`,
        template: 'reviewRequest',
        data: {
          customerName: data.customerName,
          orderNumber: data.orderNumber,
          products: data.products,
        },
      })
    } catch (error) {
      console.error('Failed to send review request email:', error)
    }
  }

  /**
   * Send loyalty points earned notification
   */
  async sendPointsEarnedNotification(data: LoyaltyNotificationData): Promise<void> {
    try {
      await emailService.sendEmail({
        to: data.customerEmail,
        subject: `You earned ${data.pointsEarned} loyalty points!`,
        template: 'pointsEarned',
        data: {
          customerName: data.customerName,
          pointsEarned: data.pointsEarned,
          totalPoints: data.totalPoints,
          orderNumber: data.orderNumber,
        },
      })
    } catch (error) {
      console.error('Failed to send points earned notification:', error)
    }
  }

  /**
   * Send notification when review is approved
   */
  async sendReviewApprovedNotification(
    email: string,
    customerName: string,
    productName: string
  ): Promise<void> {
    try {
      await emailService.sendEmail({
        to: email,
        subject: `Your review has been published!`,
        template: 'reviewApproved',
        data: {
          customerName,
          productName,
        },
      })
    } catch (error) {
      console.error('Failed to send review approved notification:', error)
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
