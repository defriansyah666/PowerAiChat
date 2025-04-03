import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Power AI Chatbot',
  description: 'A modern AI chatbot with Gemini API integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 to-gray-800 text-white`}>{children}</body>
    </html>
  )
}