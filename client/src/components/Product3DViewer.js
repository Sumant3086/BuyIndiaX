import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, useTexture } from '@react-three/drei';
import { motion } from 'framer-motion';
import './Product3DViewer.css';

// 3D Product Model Component
function ProductModel({ imageUrl, rotation }) {
  const meshRef = useRef();
  const texture = useTexture(imageUrl);
  
  useFrame((state) => {
    if (meshRef.current && rotation) {
      meshRef.current.rotation.y += 0.005;
    }
  });
  
  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[2, 2.5, 0.3]} />
      <meshStandardMaterial 
        map={texture} 
        metalness={0.3} 
        roughness={0.4}
      />
    </mesh>
  );
}

// Loading Fallback
function Loader() {
  return (
    <div className="viewer-loader">
      <div className="loader-spinner" />
      <p>Loading 3D View...</p>
    </div>
  );
}

const Product3DViewer = ({ product, autoRotate = true }) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [view, setView] = useState('3d'); // '3d' or 'image'
  
  if (!product) return null;
  
  return (
    <motion.div 
      className="product-3d-viewer"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="viewer-controls">
        <motion.button
          className={`view-toggle ${view === '3d' ? 'active' : ''}`}
          onClick={() => setView('3d')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎮 3D View
        </motion.button>
        <motion.button
          className={`view-toggle ${view === 'image' ? 'active' : ''}`}
          onClick={() => setView('image')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🖼️ Image View
        </motion.button>
      </div>
      
      {view === '3d' ? (
        <div className="canvas-container">
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [0, 0, 5], fov: 50 }}
            onPointerDown={() => setIsInteracting(true)}
            onPointerUp={() => setIsInteracting(false)}
          >
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 0, 5]} />
              
              {/* Lighting */}
              <ambientLight intensity={0.5} />
              <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1}
                castShadow
              />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              
              {/* Product Model */}
              <ProductModel 
                imageUrl={product.image} 
                rotation={autoRotate && !isInteracting}
              />
              
              {/* Environment */}
              <Environment preset="city" />
              
              {/* Shadows */}
              <ContactShadows
                position={[0, -1.4, 0]}
                opacity={0.5}
                scale={10}
                blur={2}
                far={4}
              />
              
              {/* Controls */}
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={3}
                maxDistance={8}
                autoRotate={autoRotate && !isInteracting}
                autoRotateSpeed={2}
              />
            </Suspense>
          </Canvas>
          
          <div className="viewer-hint">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              🖱️ Drag to rotate • Scroll to zoom
            </motion.p>
          </div>
        </div>
      ) : (
        <motion.div 
          className="image-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <img src={product.image} alt={product.name} />
        </motion.div>
      )}
      
      <div className="viewer-info">
        <motion.div 
          className="info-badge"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="badge-icon">✨</span>
          <span>Interactive 3D Model</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Product3DViewer;
