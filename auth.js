function getAuthUser() {
  const raw = sessionStorage.getItem("bale_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function requireAuth() {
  const user = getAuthUser();
  if (!user || !user.id) {
    location.replace("entry.html");
    throw new Error("NO_AUTH");
  }
  return user;
}
