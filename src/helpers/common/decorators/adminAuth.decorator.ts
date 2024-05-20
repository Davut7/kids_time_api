import { SetMetadata } from '@nestjs/common';

export const IS_ADMIN_KEY = 'IS_ADMIN_KEY';

export const ADMIN_AUTH = () => SetMetadata(IS_ADMIN_KEY, true);
