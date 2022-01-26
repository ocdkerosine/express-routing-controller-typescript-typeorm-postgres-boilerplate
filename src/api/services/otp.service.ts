import { Service } from 'typedi';
import generator from 'otp-generator';
import crypto from 'crypto';
import env from '@/env';

@Service()
export class OTPService {
  public generateOTP(email: string, numOfDigits = 6) {
    const otp = generator.generate(numOfDigits, { digits: true, upperCase: false, specialChars: false, alphabets: false });
    const ttl = 60 * 60 * 1000; //1 Hr in miliseconds
    const expires = Date.now() + ttl; //timestamp to 1hr in the future
    const data = `${email}.${otp}.${expires}`; // phone.otp.expiry_timestamp
    const hash = crypto.createHmac('sha256', env.jwt.secretKey).update(data).digest('hex'); // creating SHA256 hash of the data
    const fullHash = `${hash}.${expires}`; // Hash.expires, format to send to the user
    return { otp, fullHash };
  }

  public verifyOTP(email: string, hash: string, otp: any): boolean {
    // Seperate Hash value and expires from the hash returned from the user
    const [hashValue, expires] = hash.split('.');
    // Check if expiry time has passed
    const now = Date.now();
    if (now > parseInt(expires)) return false;
    // Calculate new hash with the same key and the same algorithm
    const data = `${email}.${otp}.${expires}`;
    const newCalculatedHash = crypto.createHmac('sha256', env.jwt.secretKey).update(data).digest('hex');
    // Match the hashes
    return newCalculatedHash === hashValue ? true : false;
  }
}
