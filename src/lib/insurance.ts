export type InsuranceType = "privat" | "gesetzlich" | "selbstzahler" | "bg";

export function insuranceBadge(type: InsuranceType) {
  switch (type) {
    case "privat":
      return "Privat";
    case "gesetzlich":
      return "Gesetzlich";
    case "selbstzahler":
      return "Selbstzahler";
    case "bg":
      return "BG";
    default:
      return type;
  }
}
