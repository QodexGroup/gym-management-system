import { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ImageLightbox } from '../../../components/common';
import html2canvas from 'html2canvas';

const MemberQRCard = ({ isOpen, onClose, member, customer }) => {
  const cardRef = useRef(null);
  const [cardImageUrl, setCardImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!member || !customer?.qrCodeUuid) return null;

  // Convert card to image when it opens
  useEffect(() => {
    if (isOpen && cardRef.current) {
      setIsGenerating(true);
      // Wait for QR code to render
      const timer = setTimeout(() => {
        html2canvas(cardRef.current, {
          backgroundColor: '#1e293b',
          scale: 3,
          useCORS: true,
          logging: false,
          width: 338, // 85.6mm in pixels at 96dpi
          height: 213, // 53.98mm in pixels at 96dpi
        }).then((canvas) => {
          const imageUrl = canvas.toDataURL('image/png', 1.0);
          setCardImageUrl(imageUrl);
          setIsGenerating(false);
        }).catch((error) => {
          console.error('Error generating card image:', error);
          setIsGenerating(false);
        });
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setCardImageUrl(null);
      setIsGenerating(false);
    }
  }, [isOpen, member, customer]);

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden card for rendering - positioned off-screen */}
      <div 
        className="fixed -left-[9999px] -top-[9999px]"
        style={{ 
          width: '338px', 
          height: '213px',
          pointerEvents: 'none',
          visibility: isGenerating ? 'visible' : 'hidden'
        }}
      >
        <div ref={cardRef} className="member-card-container" style={{ width: '338px', height: '213px' }}>
          {/* Modern ATM Card Design */}
          <div className="relative w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Card Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            </div>

            {/* Card Content */}
            <div className="relative h-full p-6 flex flex-col justify-between">
              {/* Top Section - Name */}
              <div className="flex-1 flex items-start">
                <div className="text-white">
                  <div className="text-[10px] uppercase tracking-widest text-white/60 mb-1 font-light">
                    Member
                  </div>
                  <div className="text-xl font-bold text-white tracking-wide leading-tight">
                    {member.name.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Bottom Section - QR Code */}
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-3">
                  {/* QR Code */}
                  <div className="bg-white rounded-xl p-2.5 shadow-lg">
                    <QRCodeSVG
                      value={customer.qrCodeUuid}
                      size={80}
                      level="H"
                      includeMargin={false}
                      fgColor="#1e293b"
                      bgColor="#ffffff"
                    />
                  </div>
                </div>

                {/* Card Chip Design Element */}
                <div className="flex flex-col items-end gap-2">
                  <div className="w-10 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md shadow-lg flex items-center justify-center">
                    <div className="w-6 h-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm"></div>
                  </div>
                  <div className="text-[8px] text-white/40 uppercase tracking-widest font-light">
                    Gym Access
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white/10 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white/5 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {cardImageUrl && (
        <ImageLightbox
          image={cardImageUrl}
          onClose={onClose}
        />
      )}
      
      {/* Loading state */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Generating card...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberQRCard;
