// ===============================
// Bale MiniApp – Stable Version
// ===============================

// ---------- Bale helpers ----------
function getUserId() {
  if (!window.Bale || !window.Bale.WebApp) {
    throw new Error("BALE_NOT_AVAILABLE");
  }

  const data = window.Bale.WebApp.initDataUnsafe;
  const uid =
    data?.user?.id ||
    data?.user_id ||
    data?.receiver?.id;

  if (!uid) {
    throw new Error("BALE_USER_NOT_READY");
  }

  return uid;
}

// ---------- API ----------
async function apiGet(path) {
  const res = await fetch(window.API_BASE + path);
  if (!res.ok) throw new Error("API_ERROR");
  return res.json();
}

async function waitForBaleUser(timeout = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (
      window.Bale &&
      window.Bale.WebApp &&
      window.Bale.WebApp.initDataUnsafe &&
      (
        window.Bale.WebApp.initDataUnsafe.user?.id ||
        window.Bale.WebApp.initDataUnsafe.user_id ||
        window.Bale.WebApp.initDataUnsafe.receiver?.id
      )
    ) {
      return true;
    }
    await new Promise(r => setTimeout(r, 100));
  }

  throw new Error("BALE_USER_TIMEOUT");
}

// ---------- UI ----------
function createCard(post) {
  const div = document.createElement("div");
  div.className = "card";

  const img = document.createElement("img");

  if (post.type === "photo" && post.photo) {
    img.src = `${window.API_BASE}/media_proxy?file_id=${post.photo}`;
  } else if (post.type === "video" && post.video_id) {
    img.src = `${window.API_BASE}/media_proxy?file_id=${post.video_id}`;
  } else {
    img.src = "https://via.placeholder.com/300x300";
  }

  div.appendChild(img);
  div.onclick = () => {
    location.href = `post.html?post_id=${post.post_id}`;
  };

  return div;
}

// ===============================
// Explore (بدون نیاز به بله)
// ===============================
window.initExplore = async function () {
  const grid = document.getElementById("grid");
  const loading = document.getElementById("loading");

  try {
    const posts = await apiGet("/get_explore");
    loading.style.display = "none";

    if (!posts.length) {
      loading.textContent = "پستی وجود ندارد";
      loading.style.display = "block";
      return;
    }

    posts.forEach(p => grid.appendChild(createCard(p)));
  } catch (e) {
    loading.textContent = "خطا در دریافت اکسپلور";
    console.error(e);
  }
};

// ===============================
// Profile (نیازمند بله)
// ===============================
window.renderProfileFromQuery = async function () {
  const targetId = new URLSearchParams(location.search).get("user_id");
  const root = document.getElementById("profile-root");
  const postsEl = document.getElementById("profile-posts");
  const loading = document.getElementById("loading");

  if (!targetId) {
    root.innerHTML = "پروفایل نامعتبر";
    return;
  }

  let viewerId;
  try {
    viewerId = getUserId();
  } catch {
    root.innerHTML = "لطفاً این صفحه را داخل اپلیکیشن بله باز کنید";
    loading.style.display = "none";
    return;
  }

  try {
    loading.style.display = "block";

    const user = await apiGet(`/get_user/${targetId}`);
    const posts = await apiGet(`/get_user_posts/${targetId}`);
    const follow = await apiGet(`/is_following?viewer=${viewerId}&target=${targetId}`);

    loading.style.display = "none";

    root.innerHTML = `
      <div class="profile-head">
        <img class="avatar" src="${user.profile_pic
          ? `${window.API_BASE}/media_proxy?file_id=${user.profile_pic}`
          : "https://via.placeholder.com/160"}">
        <div class="profile-meta">
          <h2>${user.display_name || "کاربر"}</h2>
          <p>${user.bio || ""}</p>
          <button id="followBtn" class="follow-btn">
            ${follow.is_following ? "آنفالو" : "فالو"}
          </button>
        </div>
      </div>
    `;

    postsEl.innerHTML = "";
    posts.forEach(p => postsEl.appendChild(createCard(p)));

    document.getElementById("followBtn").onclick = async () => {
      await fetch(window.API_BASE + "/follow_toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_id: viewerId,
          target_id: Number(targetId)
        })
      });
      location.reload();
    };

  } catch (e) {
    loading.textContent = "خطا در بارگذاری پروفایل";
    console.error(e);
  }
};
