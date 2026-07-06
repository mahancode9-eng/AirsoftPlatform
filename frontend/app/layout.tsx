import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export const metadata: Metadata = {
  title: "باشگاه ایرسافت | رزرو آنلاین زمین و مسابقات",
  description:
    "رزرو آنلاین سانس بازی ایرسافت، اجاره تجهیزات، رویدادها و مسابقات، لیگ تیمی و فروشگاه",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{props.children}</main>
        <Footer />
      </body>
    </html>
  )
}
