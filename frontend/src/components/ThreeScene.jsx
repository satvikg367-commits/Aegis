import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Clock,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer
} from "three";

export default function ThreeScene({ className = "", mode = "hero" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const canUseMatchMedia = typeof window.matchMedia === "function";
    const prefersReducedMotion = canUseMatchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    const isMobile = canUseMatchMedia ? window.matchMedia("(max-width: 900px)").matches : false;
    const isAmbient = mode === "ambient";

    const scene = new Scene();
    const camera = new PerspectiveCamera(isAmbient ? 52 : 46, 1, 0.1, 50);
    camera.position.set(0, isAmbient ? 0.08 : 0.24, isAmbient ? 5.5 : 4.1);

    let renderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: !isMobile && !isAmbient,
        powerPreference: "high-performance"
      });
    } catch {
      return undefined;
    }
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isAmbient ? (isMobile ? 1.1 : 1.45) : (isMobile ? 1.5 : 2)));
    renderer.domElement.className = "three-scene-canvas";
    container.appendChild(renderer.domElement);

    const ambientLight = new AmbientLight(0x89c7ff, isAmbient ? 0.82 : 0.65);
    const keyLight = new DirectionalLight(0x7bc2ff, isAmbient ? 1.3 : 1.12);
    keyLight.position.set(2.8, 2.4, 3.4);
    const rimLight = new PointLight(0x4aa8ff, isAmbient ? 0.95 : 0.76, isAmbient ? 16 : 12);
    rimLight.position.set(-2.2, -1.2, 2.5);
    scene.add(ambientLight, keyLight, rimLight);

    const heroGroup = new Group();
    scene.add(heroGroup);

    const baseGeometry = new IcosahedronGeometry(isAmbient ? 1.45 : 1, isMobile ? 0 : 1);
    const baseMaterial = new MeshStandardMaterial({
      color: 0x1a99ff,
      roughness: isAmbient ? 0.24 : 0.28,
      metalness: isAmbient ? 0.68 : 0.66,
      emissive: 0x0f2f57,
      emissiveIntensity: isAmbient ? 0.52 : 0.44,
      flatShading: true
    });
    const solidMesh = new Mesh(baseGeometry, baseMaterial);
    heroGroup.add(solidMesh);

    const wireGeometry = new IcosahedronGeometry(isAmbient ? 1.72 : 1.18, 0);
    const wireMaterial = new MeshBasicMaterial({
      color: 0xbde9ff,
      wireframe: true,
      transparent: true,
      opacity: isAmbient ? 0.2 : 0.36
    });
    const wireMesh = new Mesh(wireGeometry, wireMaterial);
    heroGroup.add(wireMesh);

    const ringGeometry = new TorusGeometry(isAmbient ? 2.1 : 1.58, isAmbient ? 0.03 : 0.038, 16, isAmbient ? 72 : 92);
    const ringMaterial = new MeshStandardMaterial({
      color: 0x65beff,
      roughness: 0.2,
      metalness: 0.52,
      transparent: true,
      opacity: isAmbient ? 0.46 : 0.72
    });
    const ringMesh = new Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI * 0.3;
    ringMesh.rotation.y = Math.PI * 0.08;
    heroGroup.add(ringMesh);

    const starsCount = isAmbient ? (isMobile ? 44 : 72) : (isMobile ? 46 : 88);
    const starsPosition = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i += 1) {
      const i3 = i * 3;
      const radius = (isAmbient ? 3.4 : 2.2) + Math.random() * (isAmbient ? 2.8 : 2.4);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      starsPosition[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starsPosition[i3 + 1] = radius * Math.cos(phi) * (isAmbient ? 0.84 : 0.72);
      starsPosition[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const starsGeometry = new BufferGeometry();
    starsGeometry.setAttribute("position", new BufferAttribute(starsPosition, 3));
    const starsMaterial = new PointsMaterial({
      size: isAmbient ? (isMobile ? 0.012 : 0.018) : (isMobile ? 0.02 : 0.028),
      color: 0xc9e9ff,
      transparent: true,
      opacity: isAmbient ? 0.5 : 0.66,
      depthWrite: false
    });
    const stars = new Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const baseCameraPosition = new Vector3(0, isAmbient ? 0.08 : 0.24, isAmbient ? 5.5 : 4.1);
    const targetCameraPosition = baseCameraPosition.clone();
    const pointer = new Vector2(0, 0);
    const clock = new Clock();
    let frameId = 0;
    let isRunning = true;

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const updatePointer = (clientX, clientY) => {
      if (isAmbient) {
        pointer.x = (clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        pointer.y = (clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        return;
      }

      const rect = container.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const onPointerMove = (event) => {
      updatePointer(event.clientX, event.clientY);
    };

    const onTouchMove = (event) => {
      const touch = event.touches?.[0];
      if (!touch) return;
      updatePointer(touch.clientX, touch.clientY);
    };

    const onPointerLeave = () => {
      pointer.set(0, 0);
    };

    const animate = () => {
      if (!isRunning) return;
      frameId = window.requestAnimationFrame(animate);
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();
      const pulse = 1 + Math.sin(elapsed * (isAmbient ? 0.9 : 1.2)) * (isAmbient ? 0.02 : 0.035);
      solidMesh.scale.setScalar(pulse);

      if (!prefersReducedMotion) {
        heroGroup.rotation.y = elapsed * (isAmbient ? 0.2 : 0.45) + pointer.x * (isAmbient ? 0.12 : 0.2);
        heroGroup.rotation.x = Math.sin(elapsed * 0.4) * (isAmbient ? 0.08 : 0.16) + pointer.y * (isAmbient ? 0.06 : 0.1);
        ringMesh.rotation.z = elapsed * (isAmbient ? 0.16 : 0.28);
        wireMesh.rotation.y = -elapsed * (isAmbient ? 0.18 : 0.36);
        stars.rotation.y = elapsed * (isAmbient ? 0.016 : 0.04);
      }

      const xParallax = isAmbient ? (isMobile ? 0.09 : 0.18) : (isMobile ? 0.14 : 0.28);
      const yParallax = isAmbient ? (isMobile ? 0.07 : 0.14) : (isMobile ? 0.11 : 0.22);
      targetCameraPosition.x = baseCameraPosition.x + pointer.x * xParallax;
      targetCameraPosition.y = baseCameraPosition.y + -pointer.y * yParallax;
      camera.position.lerp(targetCameraPosition, isAmbient ? 0.04 : 0.06);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    resize();
    animate();

    if (isAmbient) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onPointerLeave, { passive: true });
    } else {
      container.addEventListener("mousemove", onPointerMove);
      container.addEventListener("mouseleave", onPointerLeave);
      container.addEventListener("touchmove", onTouchMove, { passive: true });
      container.addEventListener("touchend", onPointerLeave, { passive: true });
    }
    window.addEventListener("resize", resize);

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(resize);
      observer.observe(container);
    }

    return () => {
      isRunning = false;
      window.cancelAnimationFrame(frameId);
      if (observer) observer.disconnect();

      if (isAmbient) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onPointerLeave);
      } else {
        container.removeEventListener("mousemove", onPointerMove);
        container.removeEventListener("mouseleave", onPointerLeave);
        container.removeEventListener("touchmove", onTouchMove);
        container.removeEventListener("touchend", onPointerLeave);
      }
      window.removeEventListener("resize", resize);

      scene.remove(stars, heroGroup, ambientLight, keyLight, rimLight);
      starsGeometry.dispose();
      starsMaterial.dispose();
      baseGeometry.dispose();
      baseMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [className, mode]);

  return <div ref={containerRef} className={`three-scene ${className}`.trim()} aria-hidden="true" />;
}
