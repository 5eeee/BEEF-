"use client";

/** Fly a product thumbnail from a source element into the header cart button. */
export function flyToCart(fromEl: HTMLElement | null, imageUrl?: string | null) {
  if (typeof window === "undefined" || !fromEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pulseCart();
    return;
  }

  const cart =
    document.querySelector<HTMLElement>("[data-cart-target]") ||
    document.querySelector<HTMLElement>(".header-action--cart");
  if (!cart) {
    pulseCart();
    return;
  }

  const from = fromEl.getBoundingClientRect();
  const to = cart.getBoundingClientRect();
  const size = Math.min(72, Math.max(40, from.width * 0.35));

  const flyer = document.createElement("div");
  flyer.className = "cart-flyer";
  flyer.style.width = `${size}px`;
  flyer.style.height = `${size}px`;
  flyer.style.left = `${from.left + from.width / 2 - size / 2}px`;
  flyer.style.top = `${from.top + from.height / 2 - size / 2}px`;

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    img.draggable = false;
    flyer.appendChild(img);
  } else {
    flyer.textContent = "+";
  }

  document.body.appendChild(flyer);
  // force layout
  flyer.getBoundingClientRect();

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  flyer.style.transform = `translate(${dx}px, ${dy}px) scale(0.28)`;
  flyer.style.opacity = "0.35";

  window.setTimeout(() => {
    flyer.remove();
    pulseCart();
  }, 620);
}

function pulseCart() {
  const cart =
    document.querySelector<HTMLElement>("[data-cart-target]") ||
    document.querySelector<HTMLElement>(".header-action--cart");
  if (!cart) return;
  cart.classList.remove("is-cart-pulse");
  // reflow
  void cart.offsetWidth;
  cart.classList.add("is-cart-pulse");
  window.setTimeout(() => cart.classList.remove("is-cart-pulse"), 480);
}
