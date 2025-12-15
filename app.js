// app.js
// ===============================
// Bale MiniApp – Safe User Access (OFFICIAL)
// ===============================
function getBaleWebApp() {
  if (!window.Bale || !window.Bale.WebApp) {
    throw new Error("BALE_WEBAPP_NOT_FOUND");
  }
  return window.Bale.WebApp;
}

function getUserId() {
  if (!window.Bale || !window.Bale.WebApp) {
    throw new Error("BALE_WEBAPP_NOT_FOUND");
  }

  const data = window.Bale.WebApp.initDataUnsafe;
  if (!data) {
    throw new Error("BALE_USER_NOT_READY");
  }

  const uid =
    data.user?.id ||
    data.user_id ||
    data.receiver?.id;

  if (!uid) {
    console.warn("initDataUnsafe =", data);
    throw new Error("BALE_USER_NOT_FOUND");
  }

  return uid;
}

// ===============================
// API Helper
// ===============================
async function apiGet(path){
  const res = await fetch(window.API_BASE + path);
  if(!res.ok) throw new Error("API error");
  return res.json();
}

// ===============================
// UI Helpers
// ===============================
function createCard(post){
  const div = document.createElement("div");
  div.className = "card";

  if(post.type === "photo" && post.photo){
    const img = document.createElement("img");
    img.src = `${window.API_BASE}/media_proxy?file_id=${post.photo}`;
    div.appendChild(img);
  }
  else if(post.type === "video" && post.video_id){
    const video = document.createElement("video");
    video.src = `${window.API_BASE}/media_proxy?file_id=${post.video_id}`;
    video.controls = true;
    div.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = `https://via.placeholder.com/300x300?text=Post+${post.post_id}`;
    div.appendChild(img);
  }

  div.onclick = () => {
    location.href = `post.html?post_id=${post.post_id}`;
  };

  return div;
}

// ===============================
// Explore
// ===============================
window.initExplore = async function(){
  const grid = document.getElementById("grid");
  const loading = document.getElementById("loading");

  try{
    const posts = await apiGet("/get_explore");
    loading.style.display = "none";

    if(posts.length === 0){
      loading.textContent = "پستی برای نمایش وجود ندارد";
      loading.style.display = "block";
      return;
    }

    posts.forEach(p => grid.appendChild(createCard(p)));
  }catch(e){
    loading.textContent = "خطا در بارگیری اکسپلور";
    console.error(e);
  }
}

// ===============================
// Single Post
// ===============================
window.renderPostFromQuery = async function(){
  const post_id = new URLSearchParams(location.search).get("post_id");
  if(!post_id){
    document.getElementById("post-container").innerHTML = "<p>پست نامعتبر</p>";
    return;
  }

  // فراخوانی getUserId در try/catch برای مدیریت خطای پرتاب شده از آن
  let user_id;
  try {
    user_id = getUserId();
  } catch (e) {
    if (e.message === "BALE_USER_NOT_FOUND") {
        // اگر خطا به دلیل نبود کاربر بله پرتاب شد، اجرای منطق فرانت‌اند را متوقف کن
        document.getElementById("post-container").innerHTML = "<p>برای مشاهده جزئیات، لطفاً اپلیکیشن را در محیط بله باز کنید.</p>";
        return;
    }
    console.error(e);
    return;
  }


  try{
    const post = await apiGet(`/get_post/${post_id}`);
    const root = document.getElementById("post-container");

    const mediaUrl =
      post.type === "photo" && post.photo
        ? `${window.API_BASE}/media_proxy?file_id=${post.photo}`
        : post.type === "video" && post.video_id
          ? `${window.API_BASE}/media_proxy?file_id=${post.video_id}`
          : `https://via.placeholder.com/720x480`;

    root.innerHTML = `
      <div class="post-main">
        <div><strong>${post.user_id}</strong></div>
        <img src="${mediaUrl}" style="width:100%;border-radius:8px;margin-top:8px">
        <div style="margin-top:8px">${post.caption || ""}</div>
        <button class="btn" id="likeBtn">❤️ ${post.likes}</button>
      </div>
    `;

    document.getElementById("likeBtn").onclick = async ()=>{
      await fetch(window.API_BASE + "/like", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          user_id,
          post_id: parseInt(post_id)
        })
      });
      location.reload();
    }

  }catch(e){
    document.getElementById("post-container").innerHTML = "<p>خطا در دریافت پست</p>";
    console.error(e);
  }
}

// ===============================
// Profile
// ===============================
window.renderProfileFromQuery = async function(){
  const target_id = new URLSearchParams(location.search).get("user_id");
  if(!target_id){
    document.getElementById("profile-root").innerHTML = "<p>پروفایل نامعتبر</p>";
    return;
  }

  // فراخوانی getUserId در try/catch برای مدیریت خطای پرتاب شده از آن
  let viewer_id;
  try {
    viewer_id = getUserId();
  } catch (e) {
    if (e.message === "BALE_USER_NOT_FOUND") {
        // اگر خطا به دلیل نبود کاربر بله پرتاب شد، اجرای منطق فرانت‌اند را متوقف کن
        document.getElementById("profile-root").innerHTML = "<p>برای مشاهده پروفایل و تعامل، لطفاً اپلیکیشن را در محیط بله باز کنید.</p>";
        return;
    }
    console.error(e);
    return;
  }

  const root = document.getElementById("profile-root");
  const postsContainer = document.getElementById("profile-posts");
  const loading = document.getElementById("loading");

  try{
    loading.style.display = "block";

    const user = await apiGet(`/get_user/${target_id}`);
    const posts = await apiGet(`/get_user_posts/${target_id}`);
    const followState = await apiGet(`/is_following?viewer=${viewer_id}&target=${target_id}`);

    loading.style.display = "none";

    const avatar = user.profile_pic
      ? `${window.API_BASE}/media_proxy?file_id=${user.profile_pic}`
      : "https://via.placeholder.com/160";

    root.innerHTML = `
      <div class="profile-head">
        <img src="${avatar}" class="avatar">
        <h2>${user.display_name || user.username || "کاربر"}</h2>
        <p>${user.bio || ""}</p>
        <button id="followBtn" class="follow-btn">
          ${followState.is_following ? "آنفالو" : "فالو"}
        </button>
      </div>
    `;

    postsContainer.innerHTML = "";
    posts.forEach(p => postsContainer.appendChild(createCard(p)));

    document.getElementById("followBtn").onclick = async ()=>{
      const res = await fetch(window.API_BASE + "/follow_toggle", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          follower_id: viewer_id,
          target_id: parseInt(target_id)
        })
      });

      const data = await res.json();
      if(data.status){
        document.getElementById("followBtn").innerText =
          data.status === "followed" ? "آنفالو" : "فالو";
      }
    };

  }catch(e){
    loading.textContent = "خطا در بارگیری پروفایل";
    console.error(e);
  }
}
