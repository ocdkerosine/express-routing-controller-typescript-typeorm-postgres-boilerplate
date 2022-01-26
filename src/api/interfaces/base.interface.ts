import { User } from '../entities';

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedResponseMeta {
  perPage: number;
  currentPage: number;
  totalPages: number;
  count: number;
  total: number;
}

export interface Error {
  message: string;
  property?: string;
}

export interface BoundAuthObject {
  user: User;
  env: string; // test or live mode
}
