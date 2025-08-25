export type Role = 'customer' | 'user' | 'manager' | 'admin';	  	

export type RoleType = 'customer' | 'user' | 'manager' | 'admin' | 'common' | 'commonAdmin';

export enum TRole {
  customer = 'customer',
  user = 'user',
  manager = 'manager',
  admin = 'admin',
}

const allRoles: Record<Role, string[]> = {
  customer:['customer', 'common'],
  user:    ['user', 'common',  ],
  manager: ['manager', 'common', 'commonAdmin'],
  admin:   ['admin', 'common', 'commonAdmin']
};

const Roles = Object.keys(allRoles) as Array<keyof typeof allRoles>;

// Map the roles to their corresponding rights
const roleRights = new Map<Role, string[]>(
  Object.entries(allRoles) as [Role, string[]][],
);

export { Roles, roleRights };
