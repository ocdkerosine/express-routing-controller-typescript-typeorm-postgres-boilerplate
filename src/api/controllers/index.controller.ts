import { JsonController, Get, HttpCode } from 'routing-controllers';
import { Service } from 'typedi';
import { BaseController } from './base.controller';

@Service()
@JsonController()
export class IndexController extends BaseController {
  @Get('/')
  @HttpCode(200)
  index() {
    return this.ok({});
  }
}
