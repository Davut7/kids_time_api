import { SetMetadata } from '@nestjs/common';

export const IS_CLIENT_KEY = 'IS_CLIENT_KEY';

export const CLIENT_AUTH = () => SetMetadata(IS_CLIENT_KEY, true);
