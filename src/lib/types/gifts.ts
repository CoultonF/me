export interface Gift {
  id: number;
  name: string;
  price: number | null;
  url: string | null;
  store: string | null;
  rating: number | null;
  dateAdded: string;
  category: string;
  notes: string | null;
  purchased: boolean;
}

export type GiftCategory = 'birthday' | 'christmas' | 'other';

export interface WishlistAccessToken {
  categories: string[];
}

export interface GiftsAPIResponse {
  gifts: Gift[];
  categories: string[];
  isAdmin: boolean;
}
