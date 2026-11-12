import { describe, expect, it } from "vitest";
import { signInKindError } from "./account";

describe("sign-in tab must match the account type", () => {
  it("blocks a homeowner account signing in as a company", () => {
    expect(signInKindError("company", ["customer"])).toBe("err_not_company");
  });
  it("blocks a company account signing in as a homeowner", () => {
    expect(signInKindError("customer", ["company"])).toBe("err_not_customer");
  });
  it("lets matching accounts and admins through", () => {
    expect(signInKindError("company", ["company"])).toBeNull();
    expect(signInKindError("customer", ["customer"])).toBeNull();
    expect(signInKindError("company", ["admin"])).toBeNull();
  });
});
