import { useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { getFileUrl } from '../../services/firebaseUrlService';

const PhotoThumbnail = ({ 
  photo, 
  index, 
  uploadProgress, 
  onRemove, 
  onView,
  showRemove = true,
  className = "aspect-square object-cover rounded-lg border-2 border-dark-200",
  wrapperClassName = "relative group w-full aspect-square overflow-hidden"
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const isUploading = uploadProgress !== undefined && uploadProgress < 100;

  useEffect(() => {
    const loadImageUrl = async () => {
      setImageError(false);
      // If we already have a URL or thumbnailUrl, use it
      if (photo?.thumbnailUrl || photo?.url) {
        setImageUrl(photo.thumbnailUrl || photo.url);
        setLoading(false);
        return;
      }

      // If we have a fileUrl (Firebase path), load it
      if (photo?.fileUrl) {
        try {
          const url = await getFileUrl(photo.fileUrl);
          setImageUrl(url);
        } catch (error) {
          console.error('Error loading image URL:', error);
          setImageUrl(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadImageUrl();
  }, [photo]);

  return (
    <div className={wrapperClassName}>
      {loading ? (
        <div className={`${className} bg-dark-200 flex items-center justify-center w-full h-full`}>
          <Camera className="w-4 h-4 text-dark-400 animate-pulse" />
        </div>
      ) : imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={photo?.fileName || 'Photo'}
          className={`${className} w-full h-full object-contain cursor-pointer`}
          onClick={() => onView?.(photo, index)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`${className} bg-dark-100 flex items-center justify-center cursor-pointer w-full h-full`} onClick={() => onView?.(photo, index)}>
          <Camera className="w-8 h-8 text-dark-300" />
        </div>
      )}
      
      {showRemove && !photo?.isScanFile && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(photo, index)}
          className="absolute -top-2 -right-2 p-1 bg-danger-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove file"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      
      {isUploading && (
        <div className="absolute inset-0 bg-dark-900/50 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {Math.round(uploadProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default PhotoThumbnail;

