export type ProviderRole = "provider" | "admin";

export type Provider = {
  id: string;
  user_id: string;
  full_name: string;
  practice_name: string;
  phone: string | null;
  role: ProviderRole;
  created_at: string;
};

export type Patient = {
  id: string;
  provider_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  weight: string | null;
  height: string | null;
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
  sku: string;
  price: number;
  active: boolean;
  sortOrder: number;
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
    | "full_name"
    | "email"
    | "phone"
    | "shipping_address"
    | "date_of_birth"
    | "weight"
    | "height"
    | "sex"
  >;
  order_items: OrderItem[];
};

export type PatientFormData = {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  weight: string;
  height: string;
  sex: string;
  shipping_address: string;
};

export type OrderLineInput = {
  productSku: string;
  quantity: number;
};
