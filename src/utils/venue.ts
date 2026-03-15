export type Venue = 'N/A' | 'Online' | 'On-site';

export const toVenue = (val?: string | null): Venue => {
  if (val === 'Online' || val === 'On-site' || val === 'N/A') {
    return val as Venue;
  }
  return 'N/A';
};
