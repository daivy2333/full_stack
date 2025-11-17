// 点击照片卡片切换背景图
const photoCards = {
  funny: ["images/um.jpg", "images/im.jpg"],
  her: ["images/her.jpg", "images/her_alt.jpg"],
  me17: ["images/me.jpg", "images/me2.jpg"],
  menow: ["images/menow.jpg", "images/menow2.jpg"]
};

document.querySelectorAll(".photo").forEach(card => {
  let index = 0;
  const id = card.id;
  const imgs = photoCards[id];
  if (!imgs) return;

  card.addEventListener("click", () => {
    index = (index + 1) % imgs.length;
    card.style.backgroundImage = `url("${imgs[index]}")`;
  });
});
