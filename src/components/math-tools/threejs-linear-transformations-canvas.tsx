
"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { create, all, matrix as createMathMatrix, multiply, type Matrix as MathJSMatrixType, type MathJsStatic } from 'mathjs';

const math: MathJsStatic = create(all);

interface ThreejsLinearTransformationsCanvasProps {
  matrix: number[][]; // Expecting a 3x3 array of numbers
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
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // === Scene ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010); // Darker background
    sceneRef.current = scene;

    // === Camera ===
    const camera = new THREE.PerspectiveCamera(
      50,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      100
    );
    camera.position.set(4, 4, 6);
    cameraRef.current = camera;

    // === Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.innerHTML = ''; // Clear previous canvas
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === Controls ===
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // === Lighting ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // === Helpers ===
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    // === Initial Vectors Setup ===
    const basisVectorsData = [
      { dir: [1, 0, 0] as [number,number,number], color: 0xff0000, transformedColor: 0xff9999, label: "i" },
      { dir: [0, 1, 0] as [number,number,number], color: 0x00ff00, transformedColor: 0x99ff99, label: "j" },
      { dir: [0, 0, 1] as [number,number,number], color: 0x0000ff, transformedColor: 0x9999ff, label: "k" },
    ];

    originalArrowsRef.current.forEach(arrow => scene.remove(arrow));
    transformedArrowsRef.current.forEach(arrow => scene.remove(arrow));
    originalArrowsRef.current = [];
    transformedArrowsRef.current = [];

    basisVectorsData.forEach(basis => {
      const origin = new THREE.Vector3(0, 0, 0);
      const dir = new THREE.Vector3().fromArray(basis.dir);
      const originalArrow = new THREE.ArrowHelper(dir.clone().normalize(), origin, dir.length(), basis.color, 0.2, 0.1);
      scene.add(originalArrow);
      originalArrowsRef.current.push(originalArrow);

      // Placeholder for transformed arrow, will be updated by matrix change
      const transformedArrow = new THREE.ArrowHelper(dir.clone().normalize(), origin, dir.length(), basis.transformedColor, 0.2, 0.1);
      scene.add(transformedArrow);
      transformedArrowsRef.current.push(transformedArrow);
    });


    // === Animation Loop ===
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
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
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        // Check if domElement is still a child before removing
        if (rendererRef.current.domElement.parentNode === currentMount) {
          currentMount.removeChild(rendererRef.current.domElement);
        }
      }
      // Clear refs to ArrowHelpers from the scene if needed, though disposing renderer should handle this
      originalArrowsRef.current.forEach(arrow => scene.remove(arrow));
      transformedArrowsRef.current.forEach(arrow => scene.remove(arrow));
    };
  }, []); // Run once on mount

  // Effect to update transformed vectors when matrix prop changes
  useEffect(() => {
    if (!sceneRef.current || !matrix || originalArrowsRef.current.length === 0 || transformedArrowsRef.current.length === 0) {
      return;
    }
    
    try {
      const mathUserMatrix = createMathMatrix(matrix);

      const basisVectorsData = [
        { v: new THREE.Vector3(1, 0, 0) },
        { v: new THREE.Vector3(0, 1, 0) },
        { v: new THREE.Vector3(0, 0, 1) },
      ];

      basisVectorsData.forEach((basis, index) => {
        // Correctly create a column vector for math.js
        const mathBasisCol = createMathMatrix([
          [basis.v.x],
          [basis.v.y],
          [basis.v.z]
        ]);
        
        const transformedMathVec = multiply(mathUserMatrix, mathBasisCol) as MathJSMatrixType;
        
        const transformedArray = (transformedMathVec.toArray() as number[][]).flat();
        
        if (transformedArray.length === 3 && transformedArray.every(val => typeof val === 'number' && isFinite(val))) {
          const transformedDir = new THREE.Vector3().fromArray(transformedArray);
          if (transformedArrowsRef.current[index]) {
            transformedArrowsRef.current[index].setDirection(transformedDir.clone().normalize());
            transformedArrowsRef.current[index].setLength(transformedDir.length() || 0.001); // Ensure length is not zero
          }
        } else {
          console.warn("Transformation resulted in invalid vector array for basis " + index, transformedArray);
           // Optionally reset to identity or hide
          if (transformedArrowsRef.current[index]) {
             const originalDir = new THREE.Vector3().fromArray(basisVectorsData[index].v.toArray());
             transformedArrowsRef.current[index].setDirection(originalDir.clone().normalize());
             transformedArrowsRef.current[index].setLength(originalDir.length());
          }
        }
      });
    } catch (e) {
      console.error("Error applying matrix transformation:", e);
      // Optionally reset transformed vectors to original if matrix is invalid
       const basisVectorsData = [
        { v: new THREE.Vector3(1, 0, 0) },
        { v: new THREE.Vector3(0, 1, 0) },
        { v: new THREE.Vector3(0, 0, 1) },
      ];
      basisVectorsData.forEach((basis, index) => {
        if (transformedArrowsRef.current[index]) {
           const originalDir = new THREE.Vector3().fromArray(basis.v.toArray());
           transformedArrowsRef.current[index].setDirection(originalDir.clone().normalize());
           transformedArrowsRef.current[index].setLength(originalDir.length());
        }
      });
    }

  }, [matrix]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", minHeight: "400px" }} />;
};

export default ThreejsLinearTransformationsCanvas;
