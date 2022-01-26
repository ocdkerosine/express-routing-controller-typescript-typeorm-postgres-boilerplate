import { PaginatedResponse, Response } from '@dtos/response.dto';
import { PaginationMeta } from '@interfaces/base.interface';

export abstract class BaseController {
  protected ok<T>(data: T, message?: string): Response<T> {
    return {
      status: 'success',
      message: message || 'Ok',
      data,
    };
  }

  protected paginated<T>(data: T[], meta: PaginationMeta): PaginatedResponse<T> {
    return {
      status: 'success',
      message: 'ok',
      data: data,
      meta: {
        perPage: meta.pageSize,
        total: meta.total,
        count: data.length,
        currentPage: meta.page,
        totalPages: Math.ceil(meta.total / meta.pageSize) || 0,
      },
    };
  }
}
