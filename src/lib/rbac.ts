import { getRoleById, mockRoles } from "@/data";
import { UserRole } from "@/types";

export function getAccessibleTabs(role: UserRole): string[] {
  const roleInfo = getRoleById(role);
  return roleInfo.accessibleModules;
}

export function canAccessTab(role: UserRole, tabId: string): boolean {
  return getRoleById(role).accessibleModules.includes(tabId);
}

export function getDefaultTab(role: UserRole): string {
  return getRoleById(role).defaultTab;
}

export function getRoleInfo(role: UserRole) {
  return getRoleById(role);
}

export function getAllRoles() {
  return mockRoles;
}
