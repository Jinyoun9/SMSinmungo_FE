import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./style.css";

const VideoChat = () => {
  const [roomName, setRoomName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [raiseHandList, setRaiseHandList] = useState([]);
  const [isCreator, setIsCreator] = useState(false); // 역할 구분
  const [currentNum, setCurrentNum] = useState("");
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:8000");

    socketRef.current.on("chat message", (data) => {
      setMessages((prevMessages) => [...prevMessages, `${data.username}: ${data.message}`]);
    });

    socketRef.current.on("currentNum", (num) => {
      console.log("Current number of users in room: ", num);
      setCurrentNum(num);
    });

    socketRef.current.on("updateHandRaiseList", (handRaiseList) => {
      setRaiseHandList(handRaiseList);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleCreateRoom = () => {
    if (roomName === "") {
      alert("Room name cannot be empty!");
      return;
    }
    setIsCreator(true); // 방 생성자는 카메라 권한 부여
    handleConnect();
  };

  const handleJoinRoom = () => {
    if (roomName === "") {
      alert("Room name cannot be empty!");
      return;
    }
    setIsCreator(false); // 참여자는 카메라 권한 없음
    handleConnect();
  };

  const handleConnect = () => {
  socketRef.current.emit("joinRoom", roomName);
  setInRoom(true);

  // 항상 getUserMedia 호출
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then((stream) => {
      setLocalStream(stream); // 스트림 상태 업데이트
      if (isCreator) {
        // 방 생성자인 경우에만 비디오 연결
        localVideoRef.current.srcObject = stream;
      }
    })
    .catch((error) => {
      console.error("Error accessing media devices: ", error);
    });
};


  const handleSendMessage = () => {
    if (message) {
      socketRef.current.emit("chat message", { room: roomName, message, username: "박진영" });
      setMessage("");
    }
  };

  const handleHandsUp = () => {
    const userName = "박진영";
    socketRef.current.emit("handsup", { username: userName });
  };

  const handleHandsDown = () => {
    const userName = "박진영";
    socketRef.current.emit("handsdown", { room: roomName, username: userName });
  };

  const toggleTrack = (trackType) => {
    if (!localStream || !isCreator) return; // 방 생성자만 트랙 활성화 가능
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
            <button className="btn btn-success me-2" onClick={handleCreateRoom}>
              방 만들기
            </button>
            <button className="btn btn-primary" onClick={handleJoinRoom}>
              참여하기
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

          {isCreator && (
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
          )}

          <div className="d-flex flex-column align-items-center mt-3">
            <button className="btn btn-warning mb-3" onClick={handleHandsUp}>
              손들기
            </button>
            <button className="btn btn-warning mb-3" onClick={handleHandsDown}>
              손 내리기
            </button>
            <ul className="list-group mb-3" style={{ width: "600px", maxHeight: "200px", overflowY: "auto" }}>
              {raiseHandList.map((user, index) => (
                <li key={index} className="list-group-item">
                  {index + 1}. {user}
                </li>
              ))}
            </ul>
            <ul className="list-group mb-3" style={{ width: "600px", maxHeight: "200px", overflowY: "auto" }}>
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
        </div>
      )}
    </div>
  );
};

export default VideoChat;
