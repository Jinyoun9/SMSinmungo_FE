import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import "./style.css";

const VideoChat = () => {
  const [roomName, setRoomName] = useState("");
  const [isStreamer, setIsStreamer] = useState(false); // 방송자인지 여부
  const [inRoom, setInRoom] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:8000");

    // 방송자가 offer를 보내면 시청자가 이를 처리
    socketRef.current.on("offer", (data) => {
      if (!isStreamer) {
        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
        });

        peer.signal(data.offer); // 방송자의 offer 수신
        peer.on("stream", (stream) => {
          setRemoteStream(stream); // 시청자가 방송자의 스트림을 받음
          remoteVideoRef.current.srcObject = stream;
        });

        peerRef.current = peer;
        peer.on("signal", (signal) => {
          socketRef.current.emit("answer", { answer: signal, roomName });
        });
      }
    });

    // 방송자가 시청자의 answer를 처리
    socketRef.current.on("answer", (data) => {
      if (isStreamer) {
        peerRef.current.signal(data.answer);
      }
    });

    return () => socketRef.current.disconnect();
  }, [isStreamer]);

  const handleCreateRoom = () => {
    if (roomName === "") {
      alert("Room name cannot be empty!");
      return;
    }
    setIsStreamer(true); // 방송자로 설정
    setInRoom(true);
    socketRef.current.emit("createRoom", roomName);

    // 방송자는 카메라와 마이크 활성화
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        const peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream,
        });

        peer.on("signal", (signal) => {
          socketRef.current.emit("offer", { offer: signal, roomName });
        });

        peerRef.current = peer;
      })
      .catch((err) => console.error(err));
  };

  const handleJoinRoom = () => {
    if (roomName === "") {
      alert("Room name cannot be empty!");
      return;
    }
    setIsStreamer(false); // 시청자로 설정
    setInRoom(true);
    socketRef.current.emit("joinRoom", roomName); // 서버에 참여 요청
  };

  return (
    <div className="container">
      <h1 className="text-center my-3">Live Streaming</h1>
      {!inRoom && (
        <div className="d-flex justify-content-center mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button className="btn btn-success me-2" onClick={handleCreateRoom}>
            Create Room
          </button>
          <button className="btn btn-primary" onClick={handleJoinRoom}>
            Join Room
          </button>
        </div>
      )}

      {inRoom && (
        <div className="video-container">
          {isStreamer ? (
            <video ref={localVideoRef} autoPlay muted style={{ width: "600px", height: "400px" }} />
          ) : (
            <video ref={remoteVideoRef} autoPlay style={{ width: "600px", height: "400px" }} />
          )}
        </div>
      )}
    </div>
  );
};

export default VideoChat;
