import {
  Sun,
  Wrench,
  Fuel,
  HardHat,
  UtensilsCrossed,
  Briefcase,
  ReceiptText,
  Shapes,
  Cable,
  Truck,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { value: "panels_modules", label: "Solar Panels & Modules", icon: Sun },
  { value: "inverters_batteries", label: "Inverters & Batteries", icon: Cable },
  { value: "materials", label: "Materials & Supplies", icon: Wrench },
  { value: "fuel_travel", label: "Fuel & Travel", icon: Fuel },
  { value: "site_labour", label: "Site Work & Labour", icon: HardHat },
  { value: "transport_logistics", label: "Transport & Logistics", icon: Truck },
  { value: "meals_stay", label: "Meals & Stay", icon: UtensilsCrossed },
  { value: "office_admin", label: "Office & Admin", icon: Briefcase },
  { value: "utilities_bills", label: "Utilities & Bills", icon: ReceiptText },
  { value: "other", label: "Other", icon: Shapes },
];

export function getCategory(value: string): Category {
  return (
    CATEGORIES.find((c) => c.value === value) ??
    CATEGORIES[CATEGORIES.length - 1]
  );
}

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);
