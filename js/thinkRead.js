let likeCount = 0;
let liked = false;

const likeIcon = document.getElementById("like-icon");
const likeCountSpan = document.getElementById("like-count");

likeIcon.addEventListener("click", () => {
  if (!liked) {
    likeCount += 1;
  } else {
    likeCount -= 1;
  }
  liked = !liked;
  likeCountSpan.textContent = likeCount;
});

let happyLiked = false;
let sadLiked = false;

const happyButton = document.getElementById("happy");
const happyCountSpan = document.getElementById("happy-count");
const sadButton = document.getElementById("sad");
const sadCountSpan = document.getElementById("sad-count");

happyButton.addEventListener("click", () => {
  if (!happyLiked) {
    happyCountSpan.textContent = parseInt(happyCountSpan.textContent) + 1;
    if (sadLiked) {
      sadCountSpan.textContent = parseInt(sadCountSpan.textContent) - 1;
      sadLiked = false;
    }
  } else {
    happyCountSpan.textContent = parseInt(happyCountSpan.textContent) - 1;
  }
  happyLiked = !happyLiked;
});

sadButton.addEventListener("click", () => {
  if (!sadLiked) {
    sadCountSpan.textContent = parseInt(sadCountSpan.textContent) + 1;
    if (happyLiked) {
      happyCountSpan.textContent = parseInt(happyCountSpan.textContent) - 1;
      happyLiked = false;
    }
  } else {
    sadCountSpan.textContent = parseInt(sadCountSpan.textContent) - 1;
  }
  sadLiked = !sadLiked;
});
