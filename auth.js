async function ensureRegistered() {
  if (!window.Bale || !window.Bale.WebApp)
    throw new Error("NOT_IN_BALE");

  await waitForBaleUser();

  const userId = getUserId();
  if (!userId)
    throw new Error("NO_USER");

  const res = await fetch(`${API_BASE}/user_exists/${userId}`);
  const data = await res.json();

  if (!data.exists) {
    location.href = "register.html";
    throw new Error("REDIRECT_REGISTER");
  }

  return userId;
}
