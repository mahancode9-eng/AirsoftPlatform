"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { api, fmtPrice, getToken, Product, Order } from "@/lib/api"

export default function ShopPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Record<number, number>>({})
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    api<Product[]>("/products").then(setProducts).catch(() => null)
  }, [])

  const add = (id: number) =>
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  const remove = (id: number) =>
    setCart((prev) => {
      const next = { ...prev }
      if (next[id] > 1) next[id] -= 1
      else delete next[id]
      return next
    })

  const cartItems = products.filter((p) => cart[p.id])
  const total = cartItems.reduce((sum, p) => sum + p.price * cart[p.id], 0)
  const count = Object.values(cart).reduce((a, b) => a + b, 0)

  const checkout = async () => {
    if (!getToken()) {
      router.push("/login")
      return
    }
    setError("")
    setLoading(true)
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          shipping_address: address,
          items: cartItems.map((p) => ({ product_id: p.id, quantity: cart[p.id] })),
        }),
      })
      const init = await api<{ redirect_url: string }>("/payments/init", {
        method: "POST",
        body: JSON.stringify({ kind: "order", ref_id: order.id }),
      })
      window.location.href = init.redirect_url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">فروشگاه</h1>
          <p className="mt-2 text-muted">تجهیزات، لباس و لوازم جانبی ایرسافت</p>
        </div>
        {count > 0 && (
          <button className="btn-primary" onClick={() => setShowCheckout(!showCheckout)}>
            سبد خرید ({count}) — {fmtPrice(total)}
          </button>
        )}
      </div>

      {showCheckout && count > 0 && (
        <div className="card mt-6">
          <div className="font-bold">تکمیل خرید</div>
          <div className="mt-4 grid gap-2">
            {cartItems.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.name} × {cart[p.id]}</span>
                <span className="font-bold">{fmtPrice(p.price * cart[p.id])}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3 font-bold">
              <span>جمع کل</span>
              <span className="text-army">{fmtPrice(total)}</span>
            </div>
          </div>
          <label className="label mt-4">آدرس ارسال</label>
          <textarea className="input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <button className="btn-primary mt-4 w-full" disabled={loading || !address} onClick={checkout}>
            {loading ? "در حال انتقال به درگاه..." : "پرداخت و ثبت سفارش"}
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="card flex flex-col">
            {p.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo} alt={p.name} className="mb-3 h-36 w-full rounded-lg object-cover" />
            )}
            <div className="font-bold">{p.name}</div>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{p.description}</p>
            <div className="mt-3 font-bold text-army">{fmtPrice(p.price)}</div>
            <div className="mt-3 flex items-center gap-2">
              {cart[p.id] ? (
                <div className="flex flex-1 items-center justify-between rounded-lg border border-line px-3 py-1.5">
                  <button className="px-2 text-lg" onClick={() => remove(p.id)}>−</button>
                  <span className="font-bold">{cart[p.id]}</span>
                  <button className="px-2 text-lg" onClick={() => add(p.id)} disabled={cart[p.id] >= p.stock}>+</button>
                </div>
              ) : (
                <button className="btn-primary flex-1 py-1.5 text-sm" disabled={p.stock <= 0} onClick={() => add(p.id)}>
                  {p.stock <= 0 ? "ناموجود" : "افزودن به سبد"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
