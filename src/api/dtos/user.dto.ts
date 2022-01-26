import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}

export class CreateUserDto extends LoginDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  businessName: string;
}

export class VerifyUserEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  hash: string;

  @IsNotEmpty()
  code: string;
}

export class ResetUserPasswordDto extends VerifyUserEmailDto {
  @IsNotEmpty()
  password: string;
}
