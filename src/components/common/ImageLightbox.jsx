import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageLightbox = ({ 
  image, 
  images = [], 
  currentIndex = 0, 
  onClose, 
  onPrevious, 
  onNext 
}) => {
  if (!image) return null;

  const hasMultipleImages = images.length > 1;
  const canGoPrevious = hasMultipleImages && currentIndex > 0;
  const canGoNext = hasMultipleImages && currentIndex < images.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <X className="w-8 h-8" />
      </button>
      
      {/* Previous Button */}
      {canGoPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious?.();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 bg-black/50 rounded-full hover:bg-black/70"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next Button */}
      {canGoNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 bg-black/50 rounded-full hover:bg-black/70"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div className="max-w-7xl max-h-[90vh] p-4 relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={image}
          alt="Image"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>
      
      {/* Image Counter - Footer */}
      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-10">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;

