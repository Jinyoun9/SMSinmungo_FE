function gotoMain() {
  window.location.href = "main.html";
}
document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.getElementById("email");
  const nickNameInput = document.getElementById("nickName");
  const birthInput = document.getElementById("birth");
  const editButton = document.getElementById("submit2");

  let isEditing = false;

  editButton.addEventListener("click", function () {
    if (!isEditing) {
      // 활성화 상태로 변경
      emailInput.disabled = false;
      nickNameInput.disabled = false;
      birthInput.disabled = false;

      // 버튼 텍스트 변경
      editButton.value = "확인";

      isEditing = true;
    } else {
      // 변경 내용 저장 (이 예제에서는 콘솔에 출력)
      const updatedEmail = emailInput.value;
      const updatedNickName = nickNameInput.value;
      const updatedBirth = birthInput.value;

      console.log("저장된 정보:");
      console.log("이메일:", updatedEmail);
      console.log("닉네임:", updatedNickName);
      console.log("생년월일:", updatedBirth);

      // 필드 비활성화
      emailInput.disabled = true;
      nickNameInput.disabled = true;
      birthInput.disabled = true;

      // 버튼 텍스트 변경
      editButton.value = "수정";

      isEditing = false;

      // 저장 동작 추가 (API 요청 또는 데이터베이스 저장 로직 추가 가능)
    }
  });
});
