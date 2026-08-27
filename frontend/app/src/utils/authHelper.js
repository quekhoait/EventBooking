export const isPendingRole = (role) => {
  if (!role) return true;
  const normalized = String(role).replace("RoleEnum.", "").trim().toUpperCase();
  return normalized === "PENDING" || normalized === "GUEST";
};
