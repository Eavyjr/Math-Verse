
"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { matrix as mathMatrix, multiply as mathMultiply, column as mathColumn } from 'mathjs';

interface ThreejsLinearTransformationsCanvasProps {
  matrix: number[][];
}

const ThreejsLinearTransformationsCanvas: React.FC<ThreejsLinearTransformationsCanvasProps> = ({ matrix }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const originalArrowsRef = useRef<THREE.ArrowHelper[]>([]);
  const transformedArrowsRef = useRef<THREE.ArrowHelper[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // === Scene ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Light grey background for better contrast
    sceneRef.current = scene;

    // === Camera ===
    const camera = new THREE.PerspectiveCamera(
      50, // Field of view
      currentMount.clientWidth / currentMount.clientHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    camera.position.set(3.5, 3, 5.5); // Adjusted for a good initial view
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // === Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.innerHTML = ''; // Clear previous canvas if any
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === Controls ===
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 25;
    controlsRef.current = controls;

    // === Lighting ===
    const ambientLight = new THREE.AmbientLight(0xffffff, Math.PI * 0.7); // Softer ambient
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI * 1.2); // Main light
    directionalLight.position.set(5, 8, 6);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xffffff, Math.PI * 0.3); // Fill light
    pointLight.position.set(-5, -3, -7);
    scene.add(pointLight);
    
    // === Helpers ===
    const axesHelper = new THREE.AxesHelper(3); // Length of axes
    scene.add(axesHelper);
    const gridHelper = new THREE.GridHelper(10, 10, 0xcccccc, 0xdddddd); // Size, divisions, center line color, grid color
    scene.add(gridHelper);

    // === Animation Loop ===
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      controls.update(); // Only if enableDamping is true
      renderer.render(scene, camera);
    };
    animate();

    // === Resize Listener ===
    const handleResize = () => {
      if (currentMount && rendererRef.current && cameraRef.current) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // === Cleanup ===
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode === currentMount) {
             currentMount.removeChild(rendererRef.current.domElement);
        }
      }
      // Dispose scene objects
      if (sceneRef.current) {
        sceneRef.current.traverse(object => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      originalArrowsRef.current = [];
      transformedArrowsRef.current = [];
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  useEffect(() => {
    if (!sceneRef.current || !matrix || matrix.length !== 3 || !matrix.every(row => row.length === 3)) {
      return; // Matrix not ready or invalid
    }
    const scene = sceneRef.current;

    // Clear previous arrows
    originalArrowsRef.current.forEach(arrow => scene.remove(arrow));
    transformedArrowsRef.current.forEach(arrow => scene.remove(arrow));
    originalArrowsRef.current = [];
    transformedArrowsRef.current = [];

    const basisVectors = [
      { v: new THREE.Vector3(1, 0, 0), color: 0xff6b6b, tColor: 0xffbaba }, // Red-ish
      { v: new THREE.Vector3(0, 1, 0), color: 0x69f0ae, tColor: 0xb9f6ca }, // Green-ish
      { v: new THREE.Vector3(0, 0, 1), color: 0x74c0fc, tColor: 0xbbdefb }, // Blue-ish
    ];

    const mathUserMatrix = mathMatrix(matrix);

    basisVectors.forEach(basis => {
      const origin = new THREE.Vector3(0, 0, 0);
      
      // Original vector
      const arrowOriginal = new THREE.ArrowHelper(basis.v.clone().normalize(), origin, basis.v.length(), basis.color, 0.2, 0.1);
      scene.add(arrowOriginal);
      originalArrowsRef.current.push(arrowOriginal);

      // Transformed vector
      try {
        const mathBasisCol = mathColumn([basis.v.x, basis.v.y, basis.v.z]);
        const transformedMathMatrix = mathMultiply(mathUserMatrix, mathBasisCol) as any; // Using any to simplify type for toArray()
        
        // Ensure toArray() result is flat
        const transformedArray: number[] = (Array.isArray(transformedMathMatrix.toArray()[0]) ? transformedMathMatrix.toArray().flat() : transformedMathMatrix.toArray()) as number[];

        if (transformedArray.length === 3 && transformedArray.every(val => typeof val === 'number' && isFinite(val))) {
          const transformedVec = new THREE.Vector3(...transformedArray);
          const arrowTransformed = new THREE.ArrowHelper(transformedVec.clone().normalize(), origin, transformedVec.length(), basis.tColor, 0.2, 0.1);
          scene.add(arrowTransformed);
          transformedArrowsRef.current.push(arrowTransformed);
        } else {
          console.warn("Transformation resulted in invalid vector:", transformedArray);
        }
      } catch (e) {
        console.error("Error during matrix transformation:", e);
      }
    });

  }, [matrix]); // Rerun effect if matrix changes

  return <div ref={mountRef} style={{ width: "100%", height: "100%", minHeight: "400px" }} />;
};

export default ThreejsLinearTransformationsCanvas;

