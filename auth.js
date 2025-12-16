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

/**
 * فقط وضعیت کاربر را برمی‌گرداند
 * ❌ redirect ندارد
 * ❌ throw ندارد
 */
async function ensureRegistered() {
  if (!window.Bale?.WebApp)
    return { ok:false, reason:"NOT_IN_BALE" };

  await waitForBaleUser();

  const userId = getUserId();
  if (!userId)
    return { ok:false, reason:"NO_USER" };

  let res;
  try {
    res = await fetch(`${API_BASE}/user_exists/${userId}`);
  } catch {
    return { ok:false, reason:"API_DOWN" };
  }

  if (!res.ok)
    return { ok:false, reason:"API_ERROR" };

  const data = await res.json();

  if (!data.exists)
    return { ok:false, reason:"NOT_REGISTERED" };

  return { ok:true, userId };
}
