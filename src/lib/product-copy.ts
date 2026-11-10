import type { Product } from "@/api";

/**
 * How each product describes itself on the picker.
 *
 * The registry in the platform database stays the source of truth for which
 * products exist, what they're called and where they live. What it doesn't carry
 * is positioning — who a product is for and what you get — and that is the part
 * someone choosing between two products actually reads.
 *
 * Keyed by product code with a fallback to the registry, so a third product still
 * appears the day it is added: it renders from its own name and tagline, just
 * without the extra lines, and gains them whenever someone writes them here.
 */
export interface ProductCopy {
  /** The product's short name — what the card is titled. */
  name: string;
  /** The category chip beside the name. */
  badge: string | null;
  /** Who it's for. The line that stops the wrong business picking the wrong one. */
  audience: string | null;
  /** One sentence on what it does. */
  description: string;
  /** What you get, in four lines or fewer. */
  highlights: string[];
}

const COPY: Record<string, Omit<ProductCopy, "description"> & { description: string }> = {
  merchant: {
    name: "Merchant",
    badge: "Booking and Invoicing",
    audience: "For Salons, Barbers & Service Businesses",
    description:
      "Manage your appointments, customers, invoices and payments, all from one workspace.",
    highlights: [
      "Salons, barbers & beauty professionals",
      "Consultants, therapists & freelancers",
      "Manage appointments & customers",
      "Invoices, payments & subscriptions",
    ],
  },
  operator: {
    name: "Operator",
    badge: "Sessions & Capacity",
    audience: "For Saunas, Fitness & Studios",
    description: "Run your sessions and capacity-based business in one place.",
    highlights: [
      "Manage sessions & classes",
      "Set capacity & availability",
      "Manage locations & staff",
      "Payments & customer access",
    ],
  },
};

export function productCopy(product: Product): ProductCopy {
  const written = COPY[product.code];
  if (written) return written;

  // An unknown product still renders — name and tagline are all the registry
  // promises, and a card with two lines beats a product nobody can choose.
  return {
    name: product.name,
    badge: null,
    audience: null,
    description: product.tagline ?? "",
    highlights: [],
  };
}
