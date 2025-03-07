export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  priceRange: string;
  imageUrl: string;
  isOpen: boolean;
  openingHours: string;
  deliveryTime: number;
  deliveryRadius: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantFilters {
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  isOpen?: boolean;
} 