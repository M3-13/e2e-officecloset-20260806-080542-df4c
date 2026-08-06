let _token: string | null = null;

export function setApiToken(token: string | null): void {
  _token = token;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }
  return headers;
}

function authHeadersMultipart(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }
  return headers;
}

const BASE_URL = '/api';

export interface ClothingItemResponse {
  id: number;
  name: string;
  category: string;
  description: string | null;
  image_url: string;
  created_at: string;
}

export interface OutfitResponse {
  id: number;
  name: string;
  items: ClothingItemResponse[];
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export async function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail ?? 'Registration failed');
  }
  return res.json();
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail ?? 'Login failed');
  }
  return res.json();
}

export async function getWardrobe(
  category?: string,
): Promise<ClothingItemResponse[]> {
  const url = new URL(`${BASE_URL}/wardrobe`, window.location.origin);
  if (category) {
    url.searchParams.set('category', category);
  }
  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch wardrobe' }));
    throw new Error(err.detail ?? 'Failed to fetch wardrobe');
  }
  return res.json();
}

export async function createWardrobeItem(
  formData: FormData,
): Promise<ClothingItemResponse> {
  const res = await fetch(`${BASE_URL}/wardrobe`, {
    method: 'POST',
    headers: authHeadersMultipart(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create item' }));
    throw new Error(err.detail ?? 'Failed to create item');
  }
  return res.json();
}

export async function getWardrobeItem(
  id: number,
): Promise<ClothingItemResponse> {
  const res = await fetch(`${BASE_URL}/wardrobe/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Item not found' }));
    throw new Error(err.detail ?? 'Item not found');
  }
  return res.json();
}

export async function deleteWardrobeItem(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/wardrobe/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete item' }));
    throw new Error(err.detail ?? 'Failed to delete item');
  }
}

export async function getOutfits(): Promise<OutfitResponse[]> {
  const res = await fetch(`${BASE_URL}/outfits`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch outfits' }));
    throw new Error(err.detail ?? 'Failed to fetch outfits');
  }
  return res.json();
}

export async function getOutfit(id: number): Promise<OutfitResponse> {
  const res = await fetch(`${BASE_URL}/outfits/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Outfit not found' }));
    throw new Error(err.detail ?? 'Outfit not found');
  }
  return res.json();
}

export async function createOutfit(
  name: string,
  itemIds: number[],
): Promise<OutfitResponse> {
  const res = await fetch(`${BASE_URL}/outfits`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, item_ids: itemIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create outfit' }));
    throw new Error(err.detail ?? 'Failed to create outfit');
  }
  return res.json();
}

export async function deleteOutfit(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/outfits/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete outfit' }));
    throw new Error(err.detail ?? 'Failed to delete outfit');
  }
}
