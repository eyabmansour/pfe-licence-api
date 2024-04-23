import { SetMetadata } from '@nestjs/common';

export const MIN_ROLE_KEY = 'MinRole';

export const MinRole = (weight: number) => SetMetadata(MIN_ROLE_KEY, weight);
