import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import Countries from "@/lib/countries";

/** Ported from the merchant dashboard's composables/utils/phone.ts. */
export function isPhoneNumberInvalid(
  dialCode: string | undefined | null,
  phone: string | undefined | null,
): boolean {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits.length) return false;

  const countryIso = Countries.find((c) => c?.dial_code === dialCode)?.code;
  if (!countryIso) return false;

  try {
    return !isValidPhoneNumber(digits, countryIso as CountryCode);
  } catch {
    return true;
  }
}
