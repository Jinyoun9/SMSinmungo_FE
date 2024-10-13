import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./style.css"; // 스타일링 파일을 따로 관리

const VideoChat = () => {
  const [roomName, setRoomName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [raiseHandList, setRaiseHandList] = useState([]); // 손들기 순서 목록
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const [currentNum, setCurrentNum] = useState("");

  useEffect(() => {
    // Socket.IO 서버 연결
    socketRef.current = io.connect("http://localhost:8000");

    socketRef.current.on("chat message", (data) => {
      setMessages((prevMessages) => [...prevMessages, `${data.username}: ${data.message}`]);
    });

    // 현재 인원 정보 수신
    socketRef.current.on("currentNum", (num) => {
      console.log("Current number of users in room: ", num);
      setCurrentNum(num); // 상태 업데이트
    });

    // 손들기 요청 수신 (서버에서 updateHandRaiseList 이벤트 받음)
    socketRef.current.on("updateHandRaiseList", (handRaiseList) => {
      setRaiseHandList(handRaiseList); // 발언 순서 목록 업데이트
    });

    return () => {
      // 컴포넌트 언마운트 시 소켓 연결 해제
      socketRef.current.disconnect();
    };
  }, []);

  const handleConnect = () => {
    if (roomName === "") {
      alert("Room name cannot be empty!");
      return;
    }
    socketRef.current.emit("joinRoom", roomName);
    setInRoom(true);

    socketRef.current.on("currentNum", (num) => {
      console.log("Current number of users in room: ", num);
      setCurrentNum(num); // 상태 업데이트
    });
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        setLocalStream(stream);
      })
      .catch(console.error);
  };

  const handleSendMessage = () => {
    if (message) {
      socketRef.current.emit("chat message", { room: roomName, message, username: "박진영" });
      setMessage("");
    }
  };

  const handleHandsUp = () => {
    const userName = "박진영"; // 실제 사용자의 이름
    socketRef.current.emit("handsup", { username: "박진영" });
  };

  const handleHandsDown = () => {
    const userName = "박진영"; // 실제 사용자의 이름
    socketRef.current.emit("handsdown", { room: roomName, userName });
  };

  const toggleTrack = (trackType) => {
    if (!localStream) return;
    const track = trackType === "video" ? localStream.getVideoTracks()[0] : localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
  };

  return (
    <div className="container">
      <h1 className="text-center my-3">현재 방 번호: {roomName}</h1>
      {!inRoom && (
        <div className="d-flex justify-content-center mb-3">
          <div className="input-group input-group-lg" style={{ maxWidth: "400px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Enter room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleConnect}>
              Connect
            </button>
          </div>
        </div>
      )}

      {inRoom && (
        <div className="d-flex flex-column align-items-center mt-3">
          <div
            id="remoteVideoContainer"
            className="bg-dark d-flex align-items-center justify-content-center"
            style={{ width: "600px", height: "450px" }}
          >
            <video muted ref={localVideoRef} autoPlay style={{ width: "600px", height: "450px" }} />
          </div>
          <h3>현재인원: {currentNum}</h3>

          <div className="d-flex flex-column align-items-center mt-3">
            {/* 손들기 버튼 */}
            <button className="btn btn-warning mb-3" onClick={handleHandsUp}>
              손들기
            </button>
            <button className="btn btn-warning mb-3" onClick={handleHandsDown}>
              손 내리기
            </button>

            {/* 발언 순서 목록 */}
            <ul className="list-group mb-3" style={{ width: "600px", maxHeight: "200px", overflowY: "auto" }}>
              {raiseHandList.map((user, index) => (
                <li key={index} className="list-group-item">
                  {index + 1}. {user}
                </li>
              ))}
            </ul>

            {/* 발언 순서 목록을 h3로 표시 */}
            {raiseHandList.length > 0 && (
              <h3>발언 순서: {raiseHandList.map((user, index) => `${index + 1}. ${user}`).join(', ')}</h3>
            )}

            {/* 채팅 메시지 */}
            <ul id="messages" className="list-group mb-3" style={{ width: "600px", maxHeight: "200px", overflowY: "auto" }}>
              {messages.map((msg, index) => (
                <li key={index} className="list-group-item">{msg}</li>
              ))}
            </ul>

            <div className="input-group input-group-lg" style={{ maxWidth: "600px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>

          <div className="d-flex mt-3">
            <button
              id="toggleVideo"
              className="btn-circle enabled-style"
              onClick={() => toggleTrack("video")}
            >
              <i id="videoIcon" className="bi bi-camera-video-fill"></i>
            </button>
            <button
              id="toggleAudio"
              className="btn-circle enabled-style"
              onClick={() => toggleTrack("audio")}
            >
              <i id="audioIcon" className="bi bi-mic-fill"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
