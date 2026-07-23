/** Browser uses same-origin /api proxy; SSR falls back to gateway URL. */
export const API_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image_url?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: string;
  is_available: boolean;
  popularity_score: number;
  image_url?: string;
  category_slug: string;
  tags: string[];
  weight_grams?: number;
  calories?: number;
  ingredients?: { name: string; is_allergen: boolean }[];
  images?: { url: string; alt_text?: string }[];
};

export type ProductList = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
};

export type CartItem = {
  product_id: string;
  product_slug: string;
  name: string;
  unit_price: string;
  quantity: number;
  image_url?: string;
  line_total: string;
};

export type Cart = {
  session_id: string;
  items: CartItem[];
  subtotal: string;
  item_count: number;
};

export type Order = {
  id: string;
  order_number: string;
  status: string;
  delivery_type: string;
  payment_method?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  comment?: string;
  subtotal: string;
  delivery_fee: string;
  discount: string;
  total: string;
  promo_code?: string;
  estimated_ready_at?: string;
  items: CartItem[];
  created_at: string;
};

export type Campaign = {
  title: string;
  description: string;
  code: string;
};

export type User = {
  id: string;
  phone: string;
  name?: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type SavedAddress = {
  id: string;
  label?: string;
  address: string;
  is_default?: boolean;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export type PaymentInitResponse = {
  payment_id: string;
  payment_url?: string;
  status: string;
};

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  product_id?: string;
  created_at: string;
};

export type ReviewList = {
  items: Review[];
  total: number;
  page: number;
  page_size: number;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover_image_url?: string;
  published_at: string;
  content?: string;
};

export type BlogPostList = {
  items: BlogPost[];
  total: number;
};

export type CompanyInfo = {
  name: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  working_hours?: string;
  inn?: string;
  ogrn?: string;
};

export const ORDER_STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Ожидает оплаты" },
  { key: "paid", label: "Оплачен" },
  { key: "preparing", label: "Готовится" },
  { key: "ready", label: "Готов" },
  { key: "delivering", label: "В пути" },
  { key: "completed", label: "Доставлен" },
];
