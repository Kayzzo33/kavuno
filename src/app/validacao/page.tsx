import { redirect } from "next/navigation";

export default function ValidationRedirectPage() {
  redirect("/catalogo?modalidade=pre_order");
}
