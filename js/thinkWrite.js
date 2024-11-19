const inputField = document.querySelector(".text-frame2");
const icon = document.querySelector(".icon");

icon.addEventListener("click", () => {
  inputField.value = "";
});
