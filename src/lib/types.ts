export type ProviderRole = "provider" | "admin";

export type ShipTo = "clinic" | "patient";

export type Provider = {
  id: string;
  user_id: string;
  full_name: string;
  practice_name: string;
  phone: string | null;
  clinic_shipping_address: string | null;
  role: ProviderRole;
  created_at: string;
};

export type Patient = {
  id: string;
  provider_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  allergies: string | null;
  sex: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  provider_id: string;
  patient_id: string;
  notes: string | null;
  ship_to: ShipTo | null;
  shipping_address: string | null;
  sync_error: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
};

export type Product = {
  name: string;
  baseName: string;
  variantLabel: string;
  sku: string;
  price: number;
  active: boolean;
  sortOrder: number;
  category: string;
  dose?: string;
  form?: string;
  deliveryMethod?: string;
};

export type InviteToken = {
  id: string;
  created_by: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
};

export type OrderWithDetails = Order & {
  patient: Pick<
    Patient,
    | "id"
    | "first_name"
    | "last_name"
    | "email"
    | "phone"
    | "date_of_birth"
    | "allergies"
    | "sex"
    | "shipping_address"
  >;
  order_items: OrderItem[];
};

export type PatientFormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  allergies: string;
  sex: string;
  shipping_address: string;
};

export type OrderLineInput = {
  productSku: string;
  quantity: number;
};

export type ProductCategoryFilter = "all" | string;
