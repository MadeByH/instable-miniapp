// ===============================
// Bale MiniApp – Stable Version
// ===============================

// ---------- API ----------
async function apiGet(path) {
  const res = await fetch(window.API_BASE + path);
  if (!res.ok) throw new Error("API_ERROR");
  return res.json();
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
