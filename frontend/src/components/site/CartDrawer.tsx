import { useNavigate } from "@tanstack/react-router";
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, cartCount, cartTotal, removeFromCart, updateQty, clearCart } = useStore();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      await api.post("/orders", { items: cart });
      clearCart();
      onClose();
      toast.success("Order placed successfully! Track it in your dashboard.");
      navigate({ to: "/dashboard", search: { tab: "orders" } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to place order. Please sign in.");
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-base font-semibold">
              Cart{" "}
              {cartCount > 0 && (
                <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-xs text-ink-foreground">
                  {cartCount}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <ShoppingBag className="h-14 w-14 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <button
                onClick={onClose}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((item) => (
                <li
                  key={`${item.id}-${item.selectedSize}-${item.selectedColour}`}
                  className="flex gap-4 rounded-xl border border-border p-3"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    {item.selectedSize && (
                      <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>
                    )}
                    {item.selectedColour && (
                      <span
                        className="mt-1 inline-block h-3 w-3 rounded-full border"
                        style={{ backgroundColor: item.selectedColour }}
                      />
                    )}
                    <p className="mt-1 text-sm font-semibold text-price">
                      ${(item.price * item.qty).toFixed(2)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-lg border border-border">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQty(item.id, item.qty - 1, item.selectedSize, item.selectedColour)
                          }
                          disabled={item.qty <= 1}
                          className="grid h-7 w-7 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm font-medium">
                          {item.qty}
                        </span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateQty(item.id, item.qty + 1, item.selectedSize, item.selectedColour)
                          }
                          className="grid h-7 w-7 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        aria-label="Remove item"
                        onClick={() =>
                          removeFromCart(item.id, item.selectedSize, item.selectedColour)
                        }
                        className="grid h-7 w-7 place-items-center rounded-lg text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-base font-semibold">${cartTotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Taxes and shipping calculated at checkout.
            </p>
            <button
              onClick={handleCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
