import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navigation } from '@/components/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cake Shop - Delicious Custom Cakes',
  description: 'Order custom cakes for any occasion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-gray-100 border-t mt-20">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">About Us</h3>
                  <p className="text-sm text-gray-600">
                    Premium custom cakes for every occasion. Quality ingredients,
                    beautiful designs, and delicious flavors.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/products" className="text-gray-600 hover:text-gray-900">Products</a></li>
                    <li><a href="/about" className="text-gray-600 hover:text-gray-900">About</a></li>
                    <li><a href="/contact" className="text-gray-600 hover:text-gray-900">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Contact</h3>
                  <p className="text-sm text-gray-600">
                    Email: info@cakeshop.com<br />
                    Phone: (555) 123-4567<br />
                    Hours: Mon-Sat 9AM-6PM
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
                © {new Date().getFullYear()} Cake Shop. All rights reserved.
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
