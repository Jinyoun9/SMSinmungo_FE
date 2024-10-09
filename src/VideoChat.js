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
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const [currentNum, setCurrentNum] = useState("");

  useEffect(() => {
    // Socket.IO 서버 연결
    socketRef.current = io.connect("http://localhost:8000");

    socketRef.current.on("chat message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });
    socketRef.current.on("currentNum", (num) => {
          console.log("Current number of users in room: ", num);
          setCurrentNum(num); // 상태 업데이트
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
    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((stream) => {
      localVideoRef.current.srcObject = stream;
      setLocalStream(stream);
    }).catch(console.error);
  };

  const handleSendMessage = () => {
    if (message) {
      socketRef.current.emit("chat message", { room: roomName, message });
      setMessage("");
    }
  };

  const toggleTrack = (trackType) => {
    if (!localStream) return;
    const track = trackType === "video" ? localStream.getVideoTracks()[0] : localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
  };

  return (
    <div className="container">
      <h1 className="text-center my-3">WebRTC React App</h1>
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
