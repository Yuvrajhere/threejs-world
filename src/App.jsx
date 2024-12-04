import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useFBX } from "@react-three/drei"; // Using useFBX for loading the FBX model and animations
import * as THREE from "three";
import "./App.css";

function MovingCharacter({ modelUrl, animationUrl, position }) {
  const fbx = useFBX(modelUrl); // Load character model and animations from the same file
  const walkFbx = useFBX(animationUrl); // Load character model and animations from the same file

  const mixerRef = useRef(null);
  const [pos, setPos] = useState(position);
  const [rotation, setRotation] = useState([0, 0, 0]); // Initialize rotation state
  const [isMoving, setIsMoving] = useState(false); // Track if the character is moving
  const [animationAction, setAnimationAction] = useState(null);

  useEffect(() => {
    const speed = 0.1; // Movement speed

    // Set up the animation mixer for the character
    if (walkFbx && walkFbx.animations && walkFbx.animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(fbx);
      const walkAction = mixerRef.current.clipAction(walkFbx.animations[0]); // Assuming the first animation is walking
      setAnimationAction(walkAction);
    }

    const handleKeyDown = (event) => {
      let direction = [0, 0]; // Default direction vector
      let isCurrentlyMoving = false;

      switch (event.key) {
        case "w":
          setPos((prevPos) => [prevPos[0], prevPos[1], prevPos[2] - speed]); // Move forward (Z)
          direction = [-1, 0]; // Moving forward
          isCurrentlyMoving = true;
          break;
        case "s":
          setPos((prevPos) => [prevPos[0], prevPos[1], prevPos[2] + speed]); // Move backward (Z)
          direction = [1, 0]; // Moving backward
          isCurrentlyMoving = true;
          break;
        case "a":
          setPos((prevPos) => [prevPos[0] - speed, prevPos[1], prevPos[2]]); // Move left (X)
          direction = [0, -1]; // Moving left
          isCurrentlyMoving = true;
          break;
        case "d":
          setPos((prevPos) => [prevPos[0] + speed, prevPos[1], prevPos[2]]); // Move right (X)
          direction = [0, 1]; // Moving right
          isCurrentlyMoving = true;
          break;
        default:
          break;
      }

      // Update rotation to face the direction of movement
      const angle = Math.atan2(direction[1], direction[0]); // Get the rotation angle
      setRotation([0, angle, 0]); // Set rotation to face the direction of movement

      // Update movement state
      setIsMoving(isCurrentlyMoving);
    };

    const handleKeyUp = () => {
      setIsMoving(false);
    };

    // Listen for keydown events
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Update the animation mixer in each frame
    const animate = () => {
      mixerRef.current.update(0.01); // Update animation every frame
    };
    const interval = setInterval(animate, 16); // Update roughly every frame (60fps)

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearInterval(interval);
    };
  }, [fbx]);

  useEffect(() => {
    // Play walking animation when moving, and stop when idle
    if (animationAction) {
      if (isMoving) {
        animationAction.play(); // Start walking animation
        animationAction.setLoop(THREE.LoopRepeat, Infinity); // Loop the walking animation
      } else {
        animationAction.stop(); // Stop walking animation when idle
      }
    }
  }, [isMoving, animationAction]);

  // Apply the updated position and rotation to the character
  if (fbx) {
    fbx.scale.set(0.01, 0.01, 0.01);
    fbx.position.set(...pos);
    fbx.rotation.set(...rotation); // Apply rotation
  }

  // Enable shadows for the character (optional)
  if (fbx) {
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  return fbx ? <primitive object={fbx} /> : null;
}

function PlatformWithCharacter() {
  const [boxHovered, setBoxHovered] = useState("");
  const [boxClicked, setBoxClicked] = useState("");

  return (
    <Canvas
      style={{ width: "100vw", height: "100vh" }} // Make canvas full screen
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
    >
      {/* Controls */}
      <OrbitControls />
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={3}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      w{/* Platform */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[10, 10, 0.5]} />
        <meshStandardMaterial color="pink" />
      </mesh>
      {/* box */}
      <mesh
        onClick={(e) => {
          setBoxClicked((prev) => (prev === "red" ? "" : "red"));
        }}
        onPointerEnter={(e) => {
          document.body.style.cursor = "pointer";
          setBoxHovered("red");
        }}
        onPointerLeave={(e) => {
          document.body.style.cursor = "auto";
          setBoxHovered("");
        }}
        position={[3, 0.5, 3]}
        castShadow
      >
        <boxGeometry
          args={boxClicked === "red" ? [1.25, 1, 1.25] : [1, 1, 1]}
        />
        <meshLambertMaterial color={boxHovered === "red" ? "gold" : "red"} />
      </mesh>
      {/* box */}
      <mesh
        onClick={(e) => {
          setBoxClicked((prev) => (prev === "green" ? "" : "green"));
        }}
        onPointerEnter={(e) => {
          document.body.style.cursor = "pointer";
          setBoxHovered("green");
        }}
        onPointerLeave={(e) => {
          document.body.style.cursor = "auto";
          setBoxHovered("");
        }}
        position={[-3, 0.5, -4]}
        castShadow
      >
        <boxGeometry
          args={boxClicked === "green" ? [1.25, 1, 1.25] : [1, 1, 1]}
        />
        <meshPhysicalMaterial
          color={boxHovered === "green" ? "gold" : "green"}
        />
      </mesh>
      {/* Grid */}
      <gridHelper args={[10, 10, "black", "red"]} position={[0, 0.01, 0]} />
      <Environment preset="night"  background environmentIntensity={1} />
      
      {/* Moving Character */}
      <MovingCharacter
        modelUrl="/IdleCharacter.fbx" // Path to your character model
        animationUrl="/WalkingCharacter.fbx" // Path to your walking animation
        position={[0, 0, 0]}
      />
    </Canvas>
  );
}

export default PlatformWithCharacter;
