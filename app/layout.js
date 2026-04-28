import './globals.css'

export const metadata = {
  title: 'VoteWave — Student Voting Portal',
  description: 'Secure web-based student election system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
