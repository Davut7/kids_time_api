import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { config } from 'dotenv';

import { Injectable } from '@nestjs/common';
import * as process from 'process';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/redirect`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      googleId: id,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
      json: profile._json,
    };

    return user;
  }
}
