export type PartnerGarage = {
  id: string
  name: string
  address: string
  phoneDisplay: string
  phoneTel: string
  // Optional pre-known coordinates. If absent, we can geocode by address.
  lat?: number
  lng?: number
}

export const partnerGarages: PartnerGarage[] = [
  {
    id: "adi-cars-charleroi",
    name: "ADI\u2011Cars",
    address: "Route de Trazegnies 738, 6031 Charleroi",
    phoneDisplay: "+32 483 00 00 30",
    phoneTel: "+32483000030",
  },
]

