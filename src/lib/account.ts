// Which sign-in tab an account belongs to. Admins may sign in from either tab.
export type AccountKind = "customer" | "company";

export function signInKindError(kind: AccountKind, roles: readonly string[]): "err_not_company" | "err_not_customer" | null {
  if (roles.includes("admin")) return null;
  const isCompany = roles.includes("company");
  if (kind === "company" && !isCompany) return "err_not_company";
  if (kind === "customer" && isCompany) return "err_not_customer";
  return null;
}
