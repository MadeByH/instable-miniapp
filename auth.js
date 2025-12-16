async function ensureRegistered() {
  if (!window.Bale || !window.Bale.WebApp) {
    throw new Error("NOT_IN_BALE");
  }

  await waitForBaleUser();

  const userId = getUserId();
  if (!userId) {
    throw new Error("NO_USER");
  }

  let res;
  try {
    res = await fetch(`${API_BASE}/user_exists/${userId}`);
  } catch {
    throw new Error("API_DOWN");
  }

  if (!res.ok) {
    throw new Error("API_ERROR");
  }

  const data = await res.json();

  if (!data.exists) {
    location.href = "register.html";
    throw new Error("REDIRECT_REGISTER");
  }

  return userId;
}
