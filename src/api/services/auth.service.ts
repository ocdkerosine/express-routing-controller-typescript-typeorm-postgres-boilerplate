import { CreateUserDto, LoginDto } from '@dtos/user.dto';
import { UnauthorizedError } from '@errors/UnauthorizedError';
import { IToken, LoginData, IVerifyEmail, IResetPassword } from '@interfaces/auth.interface';
import { Service } from 'typedi';
import { Logger, LoggerService } from '@utils/logger';
import { USER_RESPONSES, OTP_RESPONSES } from '@constants/.';
import { LOCK_KEYS } from '@constants/lock.constant';
import { User } from '@entities/user.entity';
import { JWTService } from '@services/jwt.service';
import { UserService } from '@services/user.service';
import { BadRequestError } from '@errors/BadRequestError';
import { OTPService } from './otp.service';
// import { MailService } from './mail.service';
import { LockService } from './lock.service';
import env from '@/env';

@Service()
export class AuthService {
  constructor(
    @Logger(__filename) private logger: LoggerService,
    private userService: UserService,
    private jwtService: JWTService,
    private lockService: LockService,
    private otpService: OTPService, // private mailService: MailService,
  ) {}

  //TODO add method descriptions

  // ------------------------------------------------------------------------
  //
  //
  //
  //
  //
  // Functions below here act as a way to reduce code written in controllers
  // and keep all significant code within service files
  //
  //
  //
  //
  // --------------------------------------------------------------------------

  public async signup(body: CreateUserDto): Promise<User> {
    this.logger.info('ℹ️ Signing up new user');

    //prevent parallel requests from throwing DB error
    const user = await this.lockService.acquire(`${LOCK_KEYS.CREATE_USER_KEY}${body.email}`, async () => {
      //create user
      return await this.userService.createUser(body);
      // const user = await this.userService.createUser(body);
    });

    //send verification email
    // this.mailService.sendVerificationMail({
    //   email: user.email,
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   otp: this.otpService.generateOTP(user.email),
    // });

    //TODO activity log
    this.logger.info('✅ Signup succesful');
    return user;
  }

  public async signin(body: LoginDto): Promise<LoginData> {
    this.logger.info('ℹ️ Logging user in');

    //check if user with email exists
    const user = await this.userService.getUserByEmail(body.email);
    if (!user) throw new UnauthorizedError(USER_RESPONSES.INVALID_LOGIN_DETAILS);

    //check if passwords match
    const isMatch: boolean = await user.comparePassword(body.password);
    //TODO implement signin attempts limiting
    if (!isMatch) throw new UnauthorizedError(USER_RESPONSES.INVALID_LOGIN_DETAILS);

    //check if user is verified
    if (!user.isEmailVerified) throw new UnauthorizedError(USER_RESPONSES.EMAIL_NOT_VERIFIED);

    //create access token and store cookie
    const tokenData: IToken = this.jwtService.sign(user.id);
    const cookie = this.createCookie(tokenData);

    //TODO activity log
    this.logger.info('✅ Login succesful');
    return { cookie, user, tokenData };
  }

  public createCookie(tokenData: IToken): string {
    let cookie = `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
    if (env.isProduction) cookie = cookie + ' Secure;';
    return cookie;
  }

  public async verifyEmail(body: IVerifyEmail): Promise<boolean> {
    this.logger.info('ℹ️ Verifying user email');

    //check if user with email exists
    const user = await this.userService.getUserByEmail(body.email);
    if (!user) throw new BadRequestError({ message: USER_RESPONSES.USER_NOT_FOUND, property: 'email' });

    //check if user is already verified
    if (user.isEmailVerified) return true;

    //verify user
    const verified = this.otpService.verifyOTP(body.email, body.hash, body.code);
    if (!verified) throw new BadRequestError({ message: OTP_RESPONSES.UNABLE_TO_VERIFY_OTP, property: 'otp' });
    const updatedUser = await this.userService.update(user.id, { isEmailVerified: true });

    //TODO activity log
    this.logger.info('✅ Email succesfuly verified');
    return updatedUser ? true : false;
  }

  public async resendVerifyEmail(email: string): Promise<void> {
    this.logger.info('ℹ️ Sending email verification mail');

    //check if user with email exists
    const user: User = await this.userService.getUserByEmail(email);
    if (!user) throw new BadRequestError({ message: USER_RESPONSES.USER_NOT_FOUND, property: 'email' });

    //send verification mail
    // await this.mailService.sendVerificationMail({
    //   email: user.email,
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   otp: this.otpService.generateOTP(user.email),
    // });

    //TODO activity log
    this.logger.info('✅ Email verification mail sent succesfully');
  }

  public async forgotPassword(email: string): Promise<void> {
    this.logger.info('ℹ️ Sending reset password mail');

    //check if user with email exists
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new BadRequestError({ message: USER_RESPONSES.USER_NOT_FOUND, property: 'email' });

    //check if user can reset password
    if (!user.allowPasswordReset) throw new BadRequestError({ message: 'Password reset is currently disabled on this account' });

    //send password reset mail
    // await this.mailService.sendForgotPasswordMail({
    //   email: user.email,
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   otp: this.otpService.generateOTP(user.email),
    // });

    //TODO activity log
    this.logger.info('✅ Email verification mail sent succesfully');
  }

  public async resetPassword(body: IResetPassword): Promise<boolean> {
    this.logger.info('ℹ️ Sending reset password mail');

    //check if user with email exists
    const user = await this.userService.getUserByEmail(body.email);
    if (!user) throw new BadRequestError({ message: USER_RESPONSES.USER_NOT_FOUND, property: 'email' });

    //check if user can reset password
    if (!user.allowPasswordReset) throw new BadRequestError({ message: 'Password reset is currently disabled on this account' });

    //verify user
    const verified = this.otpService.verifyOTP(body.email, body.hash, body.code);
    if (!verified) throw new BadRequestError({ message: OTP_RESPONSES.UNABLE_TO_VERIFY_OTP, property: 'otp' });
    const updatedUser = await this.userService.update(user.id, { password: body.password });

    //TODO activity log
    //send password succesfuly reset mail
    // this.mailService.sendResetPasswordSuccessMail(user);

    this.logger.info('✅ Password succesfuly reset');
    return updatedUser ? true : false;
  }
}
