import React, { useRef, useState,useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { io } from "socket.io-client";


const publishMessage = (message) => {
  console.log("Publishing message to Kafka:", message);
};

function HumanBody({ toggleAnimation, kill }) {
  const bodyRef = useRef();
  const [beating, setBeating] = useState(false);

  // Toggle beating animation
  const handleClick = () => {
    toggleAnimation();
    setBeating((prev) => !prev);
  };

  // Beating animation logic
  useFrame(({ clock }) => {
    if (bodyRef.current && beating) {
      const scale = 1 + 0.1 * Math.sin(clock.getElapsedTime() * 10);
      bodyRef.current.scale.set(scale, scale, scale);
    }
  });

  // Handle kill animation
  React.useEffect(() => {
    if (kill && bodyRef.current) {
      bodyRef.current.rotation.x = -Math.PI / 2; // Make the model fall down
    }
  }, [kill]);

  const { scene } = useGLTF("/models/realistic_human_heart.glb");

  return (
    <primitive
      object={scene}
      ref={bodyRef}
      position={[0, 0, 0]}
      scale={1}
      onClick={handleClick}
    />
  );
}

function App() {
  const [publishing, setIsPublishing] = useState(false);
  const [killed, setKilled] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Socket.IO connected"));
    newSocket.on("disconnect", () => console.log("Socket.IO disconnected"));

    return () => newSocket.disconnect();
  }, []);

  const handlePacemakerClick = () => {
    if (!socket) return;

    if (publishing) {
      socket.emit("stop");
      setIsPublishing(false);
    } else {
      socket.emit("start");
      setIsPublishing(true);
    }
  };

  const handleKillClick = () => {
    setKilled(true);
    publishMessage("KILL");
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Canvas>
        <ambientLight intensity={2.5} />
        <pointLight position={[10, 10, 10]} />
        <HumanBody toggleAnimation={handlePacemakerClick} kill={killed} />
      </Canvas>
      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <button onClick={handlePacemakerClick}>
          {publishing ? "Stop Pacemaker" : "Start Pacemaker"}
        </button>
        <button onClick={handleKillClick}>Kill</button>
      </div>
    </div>
  );
}

export default App;
