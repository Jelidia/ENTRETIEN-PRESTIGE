export const permissionKeys = [
  "dashboard",
  "dispatch",
  "jobs",
  "customers",
  "invoices",
  "sales",
  "operations",
  "reports",
  "team",
  "notifications",
  "settings",
  "technician",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];
export type PermissionMap = Record<PermissionKey, boolean>;
export type RolePermissions = Record<string, Partial<PermissionMap>>;

const emptyPermissions = permissionKeys.reduce<PermissionMap>((acc, key) => {
  acc[key] = false;
  return acc;
}, {} as PermissionMap);

const allPermissions = permissionKeys.reduce<PermissionMap>((acc, key) => {
  acc[key] = true;
  return acc;
}, {} as PermissionMap);

export const defaultRolePermissions: Record<string, PermissionMap> = {
  admin: { ...allPermissions },
  manager: { ...allPermissions },
  sales_rep: {
    ...emptyPermissions,
    dashboard: true,
    customers: true,
    sales: true,
    reports: true,
    notifications: true,
  },
  technician: {
    ...emptyPermissions,
    dashboard: true,
    jobs: true,
    technician: true,
    notifications: true,
  },
  dispatcher: {
    ...emptyPermissions,
    dashboard: true,
    dispatch: true,
    jobs: true,
    notifications: true,
  },
};

export function resolvePermissions(
  role: string,
  rolePermissions?: RolePermissions | null,
  userPermissions?: Partial<PermissionMap> | null
) {
  const base = defaultRolePermissions[role] ?? emptyPermissions;
  const roleOverride = rolePermissions?.[role] ?? {};
  const userOverride = userPermissions ?? {};

  return permissionKeys.reduce<PermissionMap>((acc, key) => {
    if (userOverride[key] !== undefined) {
      acc[key] = Boolean(userOverride[key]);
      return acc;
    }
    if (roleOverride[key] !== undefined) {
      acc[key] = Boolean(roleOverride[key]);
      return acc;
    }
    acc[key] = Boolean(base[key]);
    return acc;
  }, {} as PermissionMap);
}

export function mergeRolePermissions(rolePermissions?: RolePermissions | null) {
  const merged: Record<string, PermissionMap> = { ...defaultRolePermissions };
  if (!rolePermissions) {
    return merged;
  }
  for (const role of Object.keys(rolePermissions)) {
    merged[role] = {
      ...(defaultRolePermissions[role] ?? emptyPermissions),
      ...rolePermissions[role],
    } as PermissionMap;
  }
  return merged;
}
