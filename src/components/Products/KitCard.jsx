import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import KitDetailsModal from './KitDetailsModal'; 

export default function KitCard({ kit }) {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Collect all images from the kit itself and its items
  const allImages = [kit.image, ...(kit.kitItems ? kit.kitItems.map(item => item.image) : [])].filter(Boolean);

  useEffect(() => {
    let interval;
    if (isHovered && allImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      }, 1500);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, allImages.length]);

  return (
    <>
      <div
        className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-lg hover:border-brand-teal/20 transition-all duration-300 cursor-pointer h-full max-w-[240px] group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
          {kit.discountBadge && (
            <span className="absolute top-2 left-2 z-10 text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded uppercase shadow-xs bg-brand-pink text-white">
              {kit.discountBadge}
            </span>
          )}

          <img
            src={allImages[currentImageIndex]}
            alt={kit.name}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />

          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">
              {allImages.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-brand-teal' : 'bg-gray-400'}`} />
              ))}
            </div>
          )}

          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-brand-teal text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-md">
              <Eye size={14} />
              <span>View Details</span>
            </span>
          </div>
        </div>

        <div className="p-3 flex flex-col flex-grow">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] font-extrabold text-brand-teal uppercase truncate">{kit.school}</span>
            <span className="text-[9px] font-bold text-brand-pink whitespace-nowrap">{kit.className}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight mb-1" title={kit.name}>
            {kit.name}
          </h3>
          <p className="text-[10px] text-gray-500 line-clamp-2 mb-2 flex-grow">
            {kit.subtitle}
          </p>

          <div className="mt-auto pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="w-full flex items-center justify-between bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold px-3 py-2 rounded-lg text-xs transition-colors"
            >
              <span>Customize</span>
              <div className="flex items-center gap-1.5">
                <span>₹{kit.price}</span>
                {kit.originalPrice && (
                  <span className="text-[10px] text-gray-600 line-through">₹{kit.originalPrice}</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      <KitDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        kit={kit} 
      />
    </>
  );
}
