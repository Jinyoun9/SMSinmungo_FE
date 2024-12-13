import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

const VideoChat = () => {
  const [roomName, setRoomName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [isStreamer, setIsStreamer] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:8000");

    // 방송자로부터 스트림 offer를 받는 이벤트
    socketRef.current.on("offer", (data) => {
      if (!isStreamer) {
        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
        });

        peer.signal(data.offer); // 스트리머의 offer 수신
        peer.on("stream", (stream) => {
          setRemoteStream(stream);
          remoteVideoRef.current.srcObject = stream; // 시청자는 방송자의 스트림 표시
        });

        peerRef.current = peer;
        peer.on("signal", (signal) => {
          socketRef.current.emit("answer", { answer: signal, roomName });
        });
      }
    });

    // 스트리머가 시청자의 answer를 처리
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
    setIsStreamer(true); // 방송자 설정
    setInRoom(true);
    socketRef.current.emit("createRoom", roomName);

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
    setIsStreamer(false); // 시청자 설정
    setInRoom(true);
    socketRef.current.emit("joinRoom", roomName);
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
