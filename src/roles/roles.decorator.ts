import { SetMetadata } from '@nestjs/common';
import { UserRole } from './user-role.model';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
