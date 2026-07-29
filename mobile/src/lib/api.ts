import { getToken } from './auth-storage';
import { Booking, Listing, ListingDetail } from './types';

// EXPO_PUBLIC_ önekli değişkenler Expo tarafından otomatik olarak client'a gömülür.
// Gerçek cihazda test ederken 'localhost' yerine bilgisayarının yerel ağ IP'sini kullan.
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function authHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface SearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

function buildQuery(params: SearchParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function searchListings(params: SearchParams = {}): Promise<Listing[]> {
  const res = await fetch(`${API_BASE}/listings${buildQuery(params)}`);
  if (!res.ok) throw new Error('İlanlar yüklenemedi');
  return res.json();
}

export async function getListing(id: string): Promise<ListingDetail> {
  const res = await fetch(`${API_BASE}/listings/${id}`);
  if (!res.ok) throw new Error('İlan bulunamadı');
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Giriş başarısız');
  return data as { accessToken: string };
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Kayıt başarısız');
  return data as { accessToken: string };
}

export async function createBooking(input: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Rezervasyon oluşturulamadı');
  return data as { id: string };
}

export async function createCheckoutForm(input: {
  bookingId: string;
  identityNumber: string;
  address: string;
  city: string;
}) {
  const res = await fetch(`${API_BASE}/payments/checkout`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Ödeme başlatılamadı');
  return data as { url: string };
}

export async function getMyBookings(): Promise<Booking[]> {
  const res = await fetch(`${API_BASE}/bookings/me`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Rezervasyonlar yüklenemedi');
  return res.json();
}

export async function cancelBooking(id: string) {
  const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('İptal işlemi başarısız');
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/users/me`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Profil yüklenemedi');
  return res.json();
}

export async function uploadPhoto(fileUri: string): Promise<{ url: string }> {
  const token = await getToken();
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1] : 'jpg';
  // React Native'de FormData'ya dosya eklerken bu özel obje formatı gerekiyor
  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as any);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Yükleme başarısız');
  return data;
}

export interface CreateListingInput {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photoUrls: string[];
}

export async function createListing(input: CreateListingInput) {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'İlan oluşturulamadı');
  return data;
}

export async function onboardPayout(input: {
  identityNumber: string;
  iban: string;
  address: string;
  gsmNumber: string;
}) {
  const res = await fetch(`${API_BASE}/payments/payout/onboard`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Kayıt oluşturulamadı');
  return data;
}

export async function getPayoutStatus(): Promise<{ onboarded: boolean; hasIban: boolean }> {
  const res = await fetch(`${API_BASE}/payments/payout/status`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Durum yüklenemedi');
  return res.json();
}

export async function getInbox() {
  const res = await fetch(`${API_BASE}/messages/inbox`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Mesajlar yüklenemedi');
  return res.json();
}

export async function getConversation(otherUserId: string) {
  const res = await fetch(`${API_BASE}/messages/with/${otherUserId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Konuşma yüklenemedi');
  return res.json();
}

export async function sendMessage(receiverId: string, content: string) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ receiverId, content }),
  });
  if (!res.ok) throw new Error('Mesaj gönderilemedi');
  return res.json();
}
