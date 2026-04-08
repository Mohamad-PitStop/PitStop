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

export const partnerGarages: PartnerGarage[] = []

