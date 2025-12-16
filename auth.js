async function waitForBaleUser(timeout = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (
      window.Bale?.WebApp?.initDataUnsafe &&
      (
        window.Bale.WebApp.initDataUnsafe.user?.id ||
        window.Bale.WebApp.initDataUnsafe.user_id ||
        window.Bale.WebApp.initDataUnsafe.receiver?.id
      )
    ) return true;

    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("USER_NOT_READY");
}

function getUserId() {
  const d = window.Bale.WebApp.initDataUnsafe;
  return d.user?.id || d.user_id || d.receiver?.id || null;
}

function safeStart(fn){
  let done=false;
  [200,800,1500].forEach(t=>{
    setTimeout(()=>{
      if(!done){ done=true; fn(); }
    },t);
  });
}

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
