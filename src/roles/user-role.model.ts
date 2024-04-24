enum UserRole {
  CLIENT = 100,
  RESTAURATEUR = 500,
  DELIVERY_PERSON = 300,
  ADMINISTRATOR = 1000,
}

interface UserRoleInfo {
  name: string;
  role: UserRole;
  weight: number;
}

const UserRoleInfoMap: Record<UserRole, UserRoleInfo> = {
  [UserRole.CLIENT]: { name: 'Client', role: UserRole.CLIENT, weight: 100 },
  [UserRole.RESTAURATEUR]: {
    name: 'Restaurateur',
    role: UserRole.RESTAURATEUR,
    weight: 500,
  },
  [UserRole.DELIVERY_PERSON]: {
    name: 'Livreur',
    role: UserRole.DELIVERY_PERSON,
    weight: 300,
  },
  [UserRole.ADMINISTRATOR]: {
    name: 'Administrateur',
    role: UserRole.ADMINISTRATOR,
    weight: 1000,
  },
};

export { UserRole, UserRoleInfo, UserRoleInfoMap };
