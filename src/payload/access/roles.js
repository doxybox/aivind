export function hasPayloadRole(user, roles = []) {
  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  return roles.some((role) => userRoles.includes(role));
}

export function staffOnly({ req }) {
  return hasPayloadRole(req.user, ["journalist", "editor", "admin", "desk", "moderator"]);
}

export function editorsOnly({ req }) {
  return hasPayloadRole(req.user, ["editor", "admin", "desk"]);
}

export function adManagersOnly({ req }) {
  return hasPayloadRole(req.user, ["ad_manager", "editor", "admin"]);
}
