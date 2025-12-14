// app.js
// ===============================
// Bale User Utils
// ===============================
function getUserId() {
  if (
    typeof BaleWebApp === "undefined" ||
    !BaleWebApp.initDataUnsafe ||
    !BaleWebApp.initDataUnsafe.user ||
    !BaleWebApp.initDataUnsafe.user.id
  ) {
    alert("این برنامه فقط داخل بله کار می‌کند");
    throw new Error("BALE_USER_NOT_FOUND");
  }
  return BaleWebApp.initDataUnsafe.user.id;
}

async function apiGet(path){
  const res = await fetch(window.API_BASE + path);
  if(!res.ok) throw new Error("API error");
  return res.json();
}

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
    for(const p of posts){
      grid.appendChild(createCard(p));
    }
  }catch(e){
    loading.textContent = "خطا در بارگیری اکسپلور";
    console.error(e);
  }
}

window.renderPostFromQuery = async function(){
  const qs = new URLSearchParams(location.search);
  const post_id = qs.get("post_id");
  if(!post_id) { document.getElementById("post-container").innerHTML = "<p>پست نامعتبر</p>"; return; }
  try{
    const post = await apiGet(`/get_post/${post_id}`);
    const root = document.getElementById("post-container");
    const mediaUrl =
      post.type === "photo" && post.photo
        ? `${window.API_BASE}/media_proxy?file_id=${post.photo}`
        : post.type === "video" && post.video_id
          ? `${window.API_BASE}/media_proxy?file_id=${post.video_id}`
          : `https://via.placeholder.com/720x480?text=Media`;
    const html = `
      <div class="post-main">
        <div><strong>${post.user_id}</strong></div>
        <div style="margin-top:8px">
          <img src="${mediaUrl}" style="width:100%;border-radius:8px">
        </div>
        <div style="margin-top:8px">${post.caption || ""}</div>
        <div style="margin-top:10px">
          <button class="btn" id="likeBtn">❤️ ${post.likes}</button>
          <button class="btn" id="saveBtn">💾 ذخیره</button>
        </div>
        <div class="comments">
          <h4>کامنت‌ها</h4>
          ${post.comments.map(c=>`<div class="comment"><strong>${c.username||c.user_id}</strong>: ${c.text}</div>`).join("")}
        </div>
      </div>
    `;
    root.innerHTML = html;

    document.getElementById("likeBtn").onclick = async ()=>{
      await fetch(window.API_BASE + "/like", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id: 1, post_id: parseInt(post_id)}) // user_id=1 برای تست؛ بعدا از session استفاده کن
      });
      location.reload();
    }

  }catch(e){
    document.getElementById("post-container").innerHTML = "<p>خطا در دریافت پست</p>";
    console.error(e);
  }
}

// --- profile functions ---
window.renderProfileFromQuery = async function(){
  const target_id = new URLSearchParams(location.search).get("user_id");
  if(!target_id){
    document.getElementById("profile-root").innerHTML = "<p>پروفایل نامعتبر</p>";
    return;
  }

  const viewer_id = getUserId();

  try{
    const user = await apiGet(`/get_user/${target_id}`);
    const posts = await apiGet(`/get_user_posts/${target_id}`);
    const followState = await apiGet(`/is_following?viewer=${viewer_id}&target=${target_id}`);

    loading.style.display = "none";

    const avatar =
      user.profile_pic
        ? `${window.API_BASE}/media_proxy?file_id=${user.profile_pic}`
        : "https://via.placeholder.com/160";
    const isFollowing = followState.is_following;

    const html = `
      <div class="profile-head">
        <img src="${avatar}" class="avatar">
        <div class="profile-meta">
          <h2>${user.display_name || user.username || "کاربر"}</h2>
          <div class="stats">
            <div><strong id="followersCount">${user.followers||0}</strong><div>فالوئر</div></div>
            <div><strong id="followingCount">${user.following||0}</strong><div>فالووینگ</div></div>
            <div><strong>${posts.length}</strong><div>پست</div></div>
          </div>
          <p>${user.bio || ""}</p>
        </div>
        <div>
          <button id="followBtn" class="follow-btn ${isFollowing ? 'unfollow-btn' : ''}">${isFollowing ? 'آنفالو' : 'فالو'}</button>
        </div>
      </div>
    `;
    root.innerHTML = html;

    // render posts grid
    postsContainer.innerHTML = "";
    posts.forEach(p => {
      const card = createCard(p);
      postsContainer.appendChild(card);
    });

    // follow button handler
    document.getElementById("followBtn").onclick = async ()=>{
      try{
        const res = await fetch(window.API_BASE + "/follow_toggle", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({follower_id: parseInt(viewer_id), target_id: parseInt(user_id)})
        });
        const data = await res.json();
        if(data.status){
          // update UI counts (server returns new counts)
          if(data.status === "followed"){
            document.getElementById("followBtn").classList.add("unfollow-btn");
            document.getElementById("followBtn").innerText = "آنفالو";
          } else {
            document.getElementById("followBtn").classList.remove("unfollow-btn");
            document.getElementById("followBtn").innerText = "فالو";
          }
          if(data.target_followers !== undefined){
            document.getElementById("followersCount").innerText = data.target_followers;
          }
          if(data.follower_following !== undefined){
            document.getElementById("followingCount").innerText = data.follower_following;
          }
        } else {
          console.warn("unexpected follow response", data);
        }
      }catch(e){
        console.error(e);
        alert("خطا در انجام عملیات فالو/آنفالو");
      }
    }

  }catch(e){
    loading.style.display = "block";
    loading.textContent = "خطا در بارگیری پروفایل";
    console.error(e);
  }
}
