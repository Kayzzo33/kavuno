import { createClient } from "@/lib/supabase/server";

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  code?: string;
  discountType?: "percentage" | "fixed_amount" | "free_shipping";
  discountAmount: number;
  errorMessage?: string;
}

export async function validateAndApplyCoupon(
  code: string,
  subtotal: number,
  shippingCost: number
): Promise<CouponValidationResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, discountAmount: 0, errorMessage: "Código de cupom não informado." };
  }

  const supabase = await createClient();

  const { data: coupon, error } = await (supabase.from("coupons") as any)
    .select("*")
    .eq("code", cleanCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { valid: false, discountAmount: 0, errorMessage: "Cupom inválido ou expirado." };
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, discountAmount: 0, errorMessage: "Este cupom ainda não está ativo." };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, discountAmount: 0, errorMessage: "Este cupom já expirou." };
  }

  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { valid: false, discountAmount: 0, errorMessage: "Limite de usos deste cupom atingido." };
  }

  if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: `Valor mínimo para este cupom é de R$ ${Number(coupon.min_order_amount).toFixed(2).replace(".", ",")}.`,
    };
  }

  let calculatedDiscount = 0;

  if (coupon.discount_type === "percentage") {
    calculatedDiscount = (subtotal * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount_amount && calculatedDiscount > Number(coupon.max_discount_amount)) {
      calculatedDiscount = Number(coupon.max_discount_amount);
    }
  } else if (coupon.discount_type === "fixed_amount") {
    calculatedDiscount = Math.min(subtotal, Number(coupon.discount_value));
  } else if (coupon.discount_type === "free_shipping") {
    calculatedDiscount = shippingCost;
  }

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discount_type,
    discountAmount: Number(calculatedDiscount.toFixed(2)),
  };
}
