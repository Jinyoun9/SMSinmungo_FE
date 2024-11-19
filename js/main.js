function gotosignUp() {
  window.location.href = "signUp.html";
}
function gotologin() {
  window.location.href = "login.html";
}
function gotoMain() {
  window.location.href = "main.html";
}
function gotoWrite() {
  window.location.href = "mainWrite.html";
}
document.addEventListener("DOMContentLoaded", function () {
  // page-frame2를 선택
  const pageFrame2 = document.querySelector(".page-frame2");

  // 클릭 이벤트 추가
  pageFrame2.addEventListener("click", function () {
    alert("page-frame2가 클릭되었습니다!");
    // 원하는 동작 추가 가능
  });
});

document.querySelectorAll(".dropdown-item").forEach((item) => {
  item.addEventListener("click", function (event) {
    const selectedText = event.target.textContent;
    const dropdownButton = document.getElementById("dropdownButton");
    dropdownButton.textContent = selectedText;
  });
});
