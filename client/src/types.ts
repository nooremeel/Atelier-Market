export type Product = {
  _id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  userId: string;
};

export type Pagination = {
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number;
  previousPage: number;
  totalItems: number;
};

export type CartLine = { product: Product; quantity: number };
export type Cart = { items: CartLine[]; totalItems: number; totalPrice: number };
export type Order = {
  _id: string;
  totalPrice: number;
  products: Array<{ productData: Product; quantity: number }>;
};
export type SessionUser = { _id: string; email: string };
