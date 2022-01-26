import { Response } from 'express';
import { JsonController, Body, Post, HttpCode, Res, CurrentUser, QueryParams, QueryParam } from 'routing-controllers';
import { CreateUserDto, LoginDto, ResetUserPasswordDto, Response as IResponse, UserLoginResponse, VerifyUserEmailDto } from '@dtos/.';
import { User } from '@entities/user.entity';
import { Service } from 'typedi';
import { ResponseSchema } from '@/decorators/ResponseSchema';
import { BaseController } from './base.controller';
import { Logger, LoggerService } from '@utils/logger';
import { BadRequestError } from '@errors/BadRequestError';
import { BoundAuthObject } from '@interfaces/base.interface';
import { AuthService } from '@services/auth.service';

@Service()
@JsonController('/auth')
export class AuthController extends BaseController {
  constructor(@Logger(__filename) private logger: LoggerService, private authService: AuthService) {
    super();
  }

  @Post('/signup')
  @HttpCode(201)
  @ResponseSchema(IResponse)
  async signUp(@Body() body: CreateUserDto): Promise<IResponse<Partial<User>>> {
    const user = await this.authService.signup(body);
    return this.ok(user.view(), 'user-created');
  }

  @Post('/signin')
  @HttpCode(200)
  @ResponseSchema(UserLoginResponse)
  async logIn(@Res() res: Response, @Body() body: LoginDto): Promise<IResponse<UserLoginResponse>> {
    const { cookie, user, tokenData } = await this.authService.signin(body);
    res.setHeader('Set-Cookie', [cookie]);
    return this.ok({ accessToken: tokenData.token, expiryDate: tokenData.expiresIn, user }, 'signin-ok');
  }

  @Post('/signout')
  @HttpCode(204)
  @ResponseSchema(IResponse)
  async logOut(@CurrentUser({ required: true }) _bao: BoundAuthObject, @Res() res: Response): Promise<IResponse> {
    this.logger.info('ℹ️ Logging user out');

    //TODO delete and refresh token?
    res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);

    this.logger.info('✅ Logout succesful');
    return this.ok({}, 'signout-ok');
  }

  @Post('/verifications/email')
  @HttpCode(200)
  @ResponseSchema(IResponse)
  async verifyEmail(@QueryParams() query: VerifyUserEmailDto): Promise<IResponse> {
    const ver = await this.authService.verifyEmail(query);
    if (!ver) throw new BadRequestError({ message: 'Unable to verify email' });
    return this.ok({}, 'email-verified');
  }

  @Post('/verifications/email/resend')
  @HttpCode(200)
  @ResponseSchema(IResponse)
  async resendVerifyEmail(@QueryParam('email') email: string): Promise<IResponse> {
    await this.authService.resendVerifyEmail(email);
    return this.ok({}, 'email-verification-mail-sent');
  }

  @Post('/passwords/forgot')
  @HttpCode(200)
  @ResponseSchema(IResponse)
  async forgotPassword(@QueryParam('email') email: string): Promise<IResponse> {
    await this.authService.forgotPassword(email);
    return this.ok({}, `password-reset-mail-sent`);
  }

  @Post('/passwords/reset')
  @HttpCode(200)
  @ResponseSchema(IResponse)
  async resetPassword(@QueryParams() query: ResetUserPasswordDto): Promise<IResponse> {
    await this.authService.resetPassword(query);
    return this.ok({}, 'password-reset-ok');
  }
}
