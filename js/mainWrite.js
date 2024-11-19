const inputField = document.querySelector(".text-frame2");
const icon = document.querySelector(".icon");

icon.addEventListener("click", () => {
  inputField.value = "";
});

document.querySelectorAll(".dropdown-item").forEach((item) => {
  item.addEventListener("click", function (event) {
    const selectedText = event.target.textContent;
    const dropdownButton = document.getElementById("dropdownButton");
    dropdownButton.textContent = selectedText;
  });
});
