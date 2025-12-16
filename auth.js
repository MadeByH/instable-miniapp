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
      if(!done){
        done=true;
        fn().catch(console.error); // 🔴 مهم
      }
    },t);
  });
}

async function ensureRegistered() {
  if (!window.Bale?.WebApp)
    return { ok:false, reason:"NOT_IN_BALE" };

  await waitForBaleUser();

  const userId = getUserId();
  if (!userId)
    return { ok:false, reason:"NO_USER" };

  const res = await fetch(`${API_BASE}/user_exists/${userId}`);
  if (!res.ok)
    return { ok:false, reason:"API_ERROR" };

  const data = await res.json();

  if (!data.exists) {
    location.replace("register.html");
    return { ok:false, reason:"REDIRECT_REGISTER" };
  }

  return { ok:true, userId };
}
