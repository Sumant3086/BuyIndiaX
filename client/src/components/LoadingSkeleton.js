import React from 'react';
import './LoadingSkeleton.css';

export const ProductCardSkeleton = () => (
  <div className="product-card-skeleton">
    <div className="skeleton skeleton-image"></div>
    <div className="skeleton-content">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton-footer">
        <div className="skeleton skeleton-price"></div>
        <div className="skeleton skeleton-button"></div>
      </div>
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="product-detail-skeleton">
    <div className="skeleton skeleton-large-image"></div>
    <div className="skeleton-info">
      <div className="skeleton skeleton-title-large"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-price-large"></div>
      <div className="skeleton skeleton-button-large"></div>
    </div>
  </div>
);

export const OrderCardSkeleton = () => (
  <div className="order-card-skeleton">
    <div className="skeleton skeleton-text"></div>
    <div className="skeleton skeleton-text short"></div>
    <div className="skeleton skeleton-text"></div>
  </div>
);

const LoadingSkeleton = ({ type = 'product', count = 1 }) => {
  const skeletons = {
    product: ProductCardSkeleton,
    detail: ProductDetailSkeleton,
    order: OrderCardSkeleton
  };

  const SkeletonComponent = skeletons[type] || ProductCardSkeleton;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </>
  );
};

export default LoadingSkeleton;
