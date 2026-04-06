import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes, FaSearchPlus } from 'react-icons/fa';
import './ImageGallery.css';

const ImageGallery = ({ images = [], productName = '' }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  const imageList = images.length > 0 ? images : [{ url: 'https://via.placeholder.com/500', alt: productName }];

  const handlePrevious = () => {
    setSelectedImage((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div className="image-gallery">
      {/* Main Image */}
      <div className="main-image-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedImage}
            className={`main-image-wrapper ${isZoomed ? 'zoomed' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <img
              src={imageList[selectedImage].url || imageList[selectedImage]}
              alt={imageList[selectedImage].alt || `${productName} ${selectedImage + 1}`}
              className="main-image"
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transform: 'scale(2)',
                    }
                  : {}
              }
            />
            {!isZoomed && (
              <motion.div
                className="zoom-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <FaSearchPlus />
                <span>Hover to zoom</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {imageList.length > 1 && (
          <>
            <motion.button
              className="nav-btn prev-btn"
              onClick={handlePrevious}
              whileHover={{ scale: 1.1, x: -4 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaChevronLeft />
            </motion.button>
            <motion.button
              className="nav-btn next-btn"
              onClick={handleNext}
              whileHover={{ scale: 1.1, x: 4 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaChevronRight />
            </motion.button>
          </>
        )}

        {/* Image Counter */}
        {imageList.length > 1 && (
          <div className="image-counter">
            {selectedImage + 1} / {imageList.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {imageList.length > 1 && (
        <div className="thumbnails-container">
          {imageList.map((image, index) => (
            <motion.div
              key={index}
              className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
              onClick={() => setSelectedImage(index)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <img
                src={image.url || image}
                alt={image.alt || `Thumbnail ${index + 1}`}
              />
              {selectedImage === index && (
                <motion.div
                  className="active-indicator"
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
