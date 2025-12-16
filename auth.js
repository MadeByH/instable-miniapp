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
  // پرتاب خطا در صورت تأخیر
  throw new Error("USER_NOT_READY"); 
}

function getUserId() {
  const d = window.Bale.WebApp.initDataUnsafe;
  return d.user?.id || d.user_id || d.receiver?.id || null;
}

function safeStart(fn){
  let done = false;
  // ما فقط به یک اجرای موفق نیاز داریم، پس زمان‌بندی را کاهش داده و مطمئن‌تر می‌کنیم
  const safeFn = async () => {
    if (!done) {
      done = true;
      try {
        await fn();
      } catch (error) {
        // خطاهای پرتاب شده را به صفحه می‌فرستیم، مگر اینکه خطای ریدایرکت باشد که توسط خود تابع مدیریت می‌شود.
        if (error.message !== "REDIRECT_REGISTER" && error.message !== "USER_NOT_READY") {
          // اگر خطا در جریان اصلی نیست، آن را نمایش می‌دهیم.
          // توجه: این قسمت باید با منطق displayMessage در loadNotifications هماهنگ باشد.
          // فعلاً ما فقط مطمئن می‌شویم که خطا به صورت غیرمنتظره ظاهر نشود.
          console.error("Error in safeStart execution:", error); 
        }
      }
    }
  };
  
  // اجرای سریع و پشت سر هم برای تضمین اجرا
  setTimeout(safeFn, 200);
  setTimeout(safeFn, 800);
  setTimeout(safeFn, 1500);
}

async function ensureRegistered() {
  if (!window.Bale?.WebApp)
    return { ok: false, reason: "NOT_IN_BALE" };

  // این تابع یا برمی‌گردد یا خطا پرتاب می‌کند (USER_NOT_READY)
  await waitForBaleUser();

  const userId = getUserId();
  if (!userId)
    return { ok: false, reason: "NO_USER" };

  // API_BASE باید اینجا تعریف شده باشد یا از global گرفته شود
  const API_BASE = window.API_BASE || "https://insta-api-avn2.onrender.com/api"; 

  const res = await fetch(`${API_BASE}/user_exists/${userId}`);
  if (!res.ok)
    return { ok: false, reason: "API_ERROR" };

  const data = await res.json();

  if (!data.exists) {
    // در اینجا ریدایرکت می‌کنیم و یک شیء خاص برمی‌گردانیم
    location.replace("register.html");
    return { ok: false, reason: "REDIRECT_REGISTER" };
  }

  // موفقیت
  return { ok: true, userId: parseInt(userId) };
}
