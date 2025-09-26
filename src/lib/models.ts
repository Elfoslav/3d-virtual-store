import * as THREE from 'three';

export type Cart = {
  id: string;
  items: CartItem[];
};

export type CartItem = {
  id?: string;
  name: string;
  quantity: number;
  price?: string;
  currency?: string;
};

export type Product = {
  id: string;
  name: string;
  price: string;
  description?: string;
  currency?: string;
  variantId?: string;
  color?: string;
  photoUrl?: string;
  texture?: THREE.Texture
};