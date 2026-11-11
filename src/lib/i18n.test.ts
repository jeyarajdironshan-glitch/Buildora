import { describe, expect, it } from "vitest";
import { LANGS, MESSAGES, langFromProfile, translate } from "./i18n";
import { en } from "./i18n-messages";

describe("site languages", () => {
  it("offers English, Sinhala and Tamil", () => {
    expect(LANGS.map((l) => l.code)).toEqual(["en", "si", "ta"]);
  });
  it("has every English text translated in Sinhala and Tamil", () => {
    for (const lang of ["si", "ta"] as const) {
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(MESSAGES[lang][key], `${lang}.${key}`).toBeTruthy();
      }
    }
  });
  it("maps the signup language choice to the site language", () => {
    expect(langFromProfile("Sinhala")).toBe("si");
    expect(langFromProfile("Tamil")).toBe("ta");
    expect(translate("ta", "sign_in")).toBe("உள்நுழை");
  });
});
