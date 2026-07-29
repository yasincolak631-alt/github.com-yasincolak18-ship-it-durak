export interface Photo {
  id: string;
  url: string;
  order: number;
}

export interface Host {
  id: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  pricePerNight: string | number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photos: Photo[];
  host: Host;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  author: { firstName: string };
}

export interface ListingDetail extends Listing {
  reviews: Review[];
}

export interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalPrice: string | number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  listing: { id: string; title: string; city: string; photos: Photo[] };
}
