export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMax: 1023,
  desktopMin: 1024,
} as const

export const MOBILE_MEDIA_QUERY = `(max-width: ${BREAKPOINTS.mobileMax}px)`
export const DESKTOP_MEDIA_QUERY = `(min-width: ${BREAKPOINTS.desktopMin}px)`

