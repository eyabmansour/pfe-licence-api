import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserRoleInfo, UserRoleInfoMap } from './user-role.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    //Récupère l'objet user à partir de la requête HTTP dans le contexte.
    const { user } = context.switchToHttp().getRequest();
    //Utilise Array.prototype.some() pour vérifier si l'utilisateur possède au moins l'un des rôles requis.
    return requiredRoles.some((requiredRole) => {
      //Recherche le rôle requis dans les rôles de l'utilisateur.
      const userRoleInfo = user.roles.find(
        (role: UserRole) => role === requiredRole,
      );
      //Vérifie si l'utilisateur possède le rôle requis
      if (!userRoleInfo) {
        return false; // L'utilisateur ne possède pas ce rôle
      }
      // Récupère les informations sur le rôle requis à partir de la carte des informations sur les rôles
      const requiredRoleInfo = UserRoleInfoMap[requiredRole];
      // Vérifie si le poids du rôle de l'utilisateur est supérieur ou égal au poids du rôle requis
      return userRoleInfo.weight >= requiredRoleInfo.weight;
    });
  }
}
