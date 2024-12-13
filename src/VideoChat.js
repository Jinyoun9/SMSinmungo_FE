import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

const VideoChat = () => {
  const [roomName, setRoomName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [isStreamer, setIsStreamer] = useState(false); // 방송자 여부
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    // Socket.IO 서버 연결
    socketRef.current = io("http://localhost:8000");

    // 방송자의 Offer 수신
    socketRef.current.on("offer", (data) => {
      console.log("Offer received:", data);
      if (!isStreamer) {
        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
        });

        peer.signal(data.offer); // 방송자의 Offer 처리
        peer.on("stream", (stream) => {
          console.log("Stream received from broadcaster");
          setRemoteStream(stream);
          remoteVideoRef.current.srcObject = stream;
        });

        peerRef.current = peer;
        peer.on("signal", (answer) => {
          console.log("Sending answer to broadcaster");
          socketRef.current.emit("answer", { answer, roomName });
        });
      }
    });

    // 방송자의 Answer 수신
    socketRef.current.on("answer", (data) => {
      console.log("Answer received:", data);
      if (isStreamer) {
        peerRef.current.signal(data.answer);
      }
    });

    return () => socketRef.current.disconnect();
  }, [isStreamer]);

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
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
          stream, // 방송자의 스트림 추가
        });

        peer.on("signal", (offer) => {
          console.log("Sending offer to viewers");
          socketRef.current.emit("offer", { offer, roomName });
        });

        peerRef.current = peer;
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        alert("Unable to access camera or microphone.");
      });
  };

  const handleJoinRoom = () => {
    if (!roomName.trim()) {
        alert("Room name cannot be empty!");
        return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
        console.error("Socket is not connected. Reconnecting...");
        socketRef.current.connect(); // 소켓 재연결 시도
    }

    socketRef.current.emit("joinRoom", roomName);
    console.log("Joining room:", roomName);
};


  return (
    <div className="container">
      <h1 className="text-center my-3">Live Video Streaming</h1>

      {!inRoom && (
        <div className="d-flex justify-content-center mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={{ maxWidth: "300px" }}
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
        <div>
          <div className="d-flex justify-content-center mb-3">
            <h2>Room: {roomName}</h2>
          </div>

          <div className="d-flex justify-content-center">
            {isStreamer ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                style={{ width: "600px", height: "400px", border: "2px solid black" }}
              />
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                style={{ width: "600px", height: "400px", border: "2px solid black" }}
              />
            )}
          </div>

          {!isStreamer && !remoteStream && (
            <div className="d-flex justify-content-center mt-3">
              <p>Waiting for the broadcaster...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoChat;
