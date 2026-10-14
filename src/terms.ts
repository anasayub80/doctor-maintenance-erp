import type { Quote, Service, State } from "./domain.ts";
export interface ServiceTerm {
  id: string;
  text: string;
  enabled: boolean;
  defaultSelected: boolean;
}
export interface QuoteTerm {
  id: string;
  text: string;
  selected: boolean;
}
const shared = [
  "Work is limited to the scope and quantities listed in this quotation. Any additions require written approval.",
  "The client will provide safe access to the property during the agreed working hours.",
];
const specific: Record<string, string[]> = {
  S1: [
    "Existing AC faults identified during inspection will be quoted separately before repair.",
    "Replacement parts, refrigerant and additional piping are excluded unless listed in the scope.",
    "The client will provide a working electrical supply and access to indoor and outdoor units.",
  ],
  S2: [
    "Concealed pipe damage or additional leaks discovered after opening will be reported for approval.",
    "Civil repair, tiling and restoration are excluded unless specifically itemized.",
  ],
  S3: [
    "Electrical work will follow the agreed circuit and point schedule. Additional points require a separate approval.",
    "Existing wiring defects outside the quoted scope will be reported before remedial work proceeds.",
  ],
  S4: [
    "Paint brand, finish and colour must be approved before application.",
    "Furniture and accessible surfaces will be covered; the client should secure valuables before work begins.",
    "Active seepage and structural cracks must be resolved before painting; treatment is included only when itemized.",
  ],
  S5: [
    "A sample finish must be approved before full application. Natural variations in texture may occur.",
    "Surface preparation and substrate repair are included only to the extent specified in the scope.",
  ],
  S6: [
    "Dimensions, material grade, hardware and finish must be approved before fabrication.",
    "Changes after fabrication begins may affect price and delivery dates.",
  ],
  S7: [
    "The cabinet layout, dimensions, sheets, hardware and finish must be approved before production.",
    "Plumbing, electrical alterations and countertop work are included only when listed in the scope.",
    "Conditions discovered behind existing cabinets will be reviewed with the client before additional work.",
  ],
  S8: [
    "Flooring material, colour and layout will be confirmed before installation.",
    "Subfloor levelling and moisture treatment are excluded unless listed in the scope.",
  ],
  S9: [
    "Camera placement, cable routes and equipment specifications must be approved before installation.",
    "Internet service and third-party subscription charges are excluded unless itemized.",
  ],
  S10: [
    "Work follows the approved scope and specifications; structural changes require written approval.",
    "Unforeseen site conditions may require a revised scope, price or completion date.",
  ],
  S11: [
    "The application area and waterproofing system must be agreed after site inspection.",
    "Warranty scope and exclusions apply only where explicitly stated in this quotation.",
  ],
  S12: [
    "Cleaning is limited to accessible areas and agreed tasks. Hazardous material removal is excluded.",
    "The client will secure valuables and provide water and electricity during the service.",
  ],
  S13: [
    "Replacement parts and safety upgrades are quoted separately unless itemized.",
    "Installation requires suitable existing plumbing, ventilation and electrical or gas connections.",
  ],
  S14: [
    "Layout, material and sample finish will be approved before installation.",
    "Existing wall defects must be identified before application; repairs are included only when itemized.",
  ],
};
export function defaultTerms(serviceId: string): ServiceTerm[] {
  return [...shared, ...(specific[serviceId] || [])].map((text, i) => ({
    id: `${serviceId}-term-${i + 1}`,
    text,
    enabled: true,
    defaultSelected: true,
  }));
}
export function serviceTerms(service: Service): ServiceTerm[] {
  return service.quotationTerms ?? defaultTerms(service.id);
}
export function snapshotTerms(
  service: Service,
): Pick<Quote, "serviceTerms" | "serviceTermsVersion"> {
  return {
    serviceTerms: serviceTerms(service)
      .filter((t) => t.enabled)
      .map((t) => ({ id: t.id, text: t.text, selected: t.defaultSelected })),
    serviceTermsVersion: service.termsVersion ?? 1,
  };
}
export function initializeDraftTerms(q: Quote, service: Service): Quote {
  return ["Draft", "Ready for review"].includes(q.status) &&
    q.serviceTerms === undefined
    ? { ...q, ...snapshotTerms(service) }
    : structuredClone(q);
}
export function migrateDemoState(s: State): State {
  return {
    ...s,
    services: s.services.map((service) => ({
      ...service,
      quotationTerms: serviceTerms(service),
      termsVersion: service.termsVersion ?? 1,
    })),
  };
}
export function selectedTerms(q: Quote): string[] {
  return (q.serviceTerms || []).filter((t) => t.selected).map((t) => t.text);
}
