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
  const [raiseHandList, setRaiseHandList] = useState([]);
  const [isStreamActive, setIsStreamActive] = useState(false); // 송출 활성화 여부
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [currentNum, setCurrentNum] = useState("");

  useEffect(() => {
    // Socket.IO 서버 연결
    socketRef.current = io.connect("http://localhost:8000");
    socketRef.current.on("chat message", (data) => {
      setMessages((prevMessages) => [...prevMessages, `${data.username}: ${data.message}`]);
    });

    socketRef.current.on("streamActive", (isActive) => {
      setIsStreamActive(isActive);
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

    // WebRTC offer, answer, candidate 이벤트 수신
    socketRef.current.on("offer", handleReceiveOffer);
    socketRef.current.on("answer", handleReceiveAnswer);
    socketRef.current.on("candidate", handleNewICECandidateMsg);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleConnect = async () => {
    if (roomName === "") {
      alert("Room name cannot be empty!");
      return;
    }

    socketRef.current.emit("joinRoom", roomName);
    setInRoom(true);

    // 첫 번째 사용자는 카메라와 마이크에 접근하여 스트림을 송출
    if (!isStreamActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        // 첫 번째 사용자만 스트림을 송출하는 피어 연결 생성
        initializePeerConnection(stream);

        // 송출 시작 상태 서버에 전달
        socketRef.current.emit("streamActive", true, roomName);
        setIsStreamActive(true);

        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socketRef.current.emit("offer", offer, roomName);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("카메라와 마이크에 접근할 수 없습니다. 다른 애플리케이션이 사용 중인지 확인해주세요.");
      }
    } else {
      // 이미 스트림이 활성화된 경우, 첫 번째 사용자의 스트림을 요청
      socketRef.current.emit("requestStream", roomName);
    }
  };

  // 스트림 송출을 위한 피어 연결 초기화 함수
  const initializePeerConnection = (stream) => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((track) => peerConnectionRef.current.addTrack(track, stream));

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("candidate", event.candidate, roomName);
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };

  // 첫 번째 사용자의 스트림을 수신할 때 이벤트 리스너 설정
  useEffect(() => {
    socketRef.current.on("provideStream", (streamData) => {
      const stream = new MediaStream(streamData.tracks);
      setRemoteStream(stream);
      remoteVideoRef.current.srcObject = stream;
    });

    return () => {
      socketRef.current.off("provideStream");
    };
  }, []);

  const handleReceiveOffer = async (offer) => {
    if (!peerConnectionRef.current) handleConnect();

    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    socketRef.current.emit("answer", answer, roomName);
  };

  const handleReceiveAnswer = async (answer) => {
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleNewICECandidateMsg = (candidate) => {
    const iceCandidate = new RTCIceCandidate(candidate);
    peerConnectionRef.current.addIceCandidate(iceCandidate);
  };

  const handleSendMessage = () => {
    if (message) {
      socketRef.current.emit("chat message", { room: roomName, message, username: "박진영" });
      setMessage("");
    }
  };

  const handleHandsUp = () => {
    const userName = "박진영";
    socketRef.current.emit("handsup", { username: "박진영" });
  };

  const handleHandsDown = () => {
    const userName = "박진영";
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
            <video ref={remoteVideoRef} autoPlay style={{ width: "600px", height: "450px" }} />
          </div>
          <h3>현재인원: {currentNum}</h3>

          <div className="d-flex flex-column align-items-center mt-3">
            <button className="btn btn-warning mb-3" onClick={handleHandsUp}>
              손들기
            </button>
            <button className="btn btn-warning mb-3" onClick={handleHandsDown}>
              손 내리기
            </button>

            {/* 발언 순서 카드 스타일 목록 */}
            <div className="d-flex flex-wrap justify-content-center mb-3" style={{ gap: "10px", maxWidth: "600px", maxHeight: "300px", overflowY: "auto" }}>
              {raiseHandList.map((user, index) => (
                <div key={index} className="card text-center" style={{ width: "120px", borderRadius: "10px" }}>
                  <div className="card-body">
                    <h5 className="card-title" style={{ fontSize: "1.5em", color: "#ffc107" }}>{index + 1}번</h5>
                    <p className="card-text" style={{ fontSize: "1.1em" }}>{user}</p>
                  </div>
                </div>
              ))}
            </div>

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
