import React, { useRef, useState } from 'react';
import { Camera, CreditCard } from 'lucide-react';
import { compressImage } from '../../utils';
import { useNotifications } from '../../context/NotificationContext';

interface PhotoUploadProps {
  type: 'selfie' | 'id';
  initialImage: string | null;
  idType?: string;
  onIdTypeChange?: (idType: string) => void;
  onNext: (imageData: string) => void;
  onBack: () => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  type,
  initialImage,
  idType = 'Aadhaar',
  onIdTypeChange,
  onNext,
  onBack,
}) => {
  const [image, setImage] = useState<string | null>(initialImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error } = useNotifications();

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image: selfies max 800px, IDs max 1200px
      const maxWidth = type === 'selfie' ? 800 : 1200;
      const dataURL = await compressImage(file, maxWidth, 0.8);
      setImage(dataURL);
    } catch (err) {
      error('Failed to process image. Please try again.');
    }
  };

  const handleRetake = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Automatically trigger upload again
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleContinue = () => {
    if (image) {
      onNext(image);
    }
  };

  const idTypes = ['Aadhaar', 'Passport', 'Driving License', 'Voter ID', 'Other'];

  return (
    <div className="customer-form-wrapper fadeIn">
      {/* Progress header */}
      <div className="progress-bar">
        <div className="progress-steps">
          <div className="progress-step completed"><span>✓</span></div>
          <div className="progress-line completed" />
          <div className={`progress-step ${type === 'selfie' ? 'active' : 'completed'}`}>
            <span>{type === 'selfie' ? '2' : '✓'}</span>
          </div>
          <div className={`progress-line ${type === 'id' ? 'active' : ''}`} />
          <div className={`progress-step ${type === 'id' ? 'active' : ''}`}>
            <span>3</span>
          </div>
          <div className="progress-line" />
          <div className="progress-step"><span>4</span></div>
        </div>
        <p className="progress-label">
          {type === 'selfie' ? 'Step 2 of 4 — Take a Selfie' : 'Step 3 of 4 — Government ID'}
        </p>
      </div>

      <div className={type === 'selfie' ? 'selfie-section' : 'id-section'}>
        <p className="section-instruction">
          {type === 'selfie'
            ? 'Take a clear photo of your face. Remove sunglasses and hats.'
            : 'Upload a clear photo of your government-issued ID.'}
        </p>

        {type === 'id' && onIdTypeChange && (
          <div className="id-type-selector">
            {idTypes.map((t) => (
              <button
                key={t}
                type="button"
                className={`pill-btn ${idType === t ? 'active' : ''}`}
                onClick={() => onIdTypeChange(t)}
              >
                {t === 'Driving License' ? 'DL' : t}
              </button>
            ))}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture={type === 'selfie' ? 'user' : 'environment'}
          style={{ display: 'none' }}
        />

        {type === 'selfie' ? (
          <div className="selfie-preview-container" onClick={handleContainerClick}>
            {image ? (
              <img src={image} className="selfie-preview-img" alt="Selfie preview" />
            ) : (
              <div className="selfie-placeholder">
                <Camera size={48} strokeWidth={1.5} />
                <p>Tap to take a selfie</p>
              </div>
            )}
          </div>
        ) : (
          <div className="id-upload-area" onClick={handleContainerClick}>
            {image ? (
              <img src={image} className="id-preview-img" alt="ID preview" />
            ) : (
              <div className="upload-placeholder">
                <CreditCard size={48} strokeWidth={1.5} />
                <p>Tap to upload or capture ID photo</p>
                <span className="upload-hint">JPEG, PNG — Max 5MB</span>
              </div>
            )}
          </div>
        )}

        {image && (
          <div className={type === 'selfie' ? 'selfie-actions' : 'id-actions'}>
            <button type="button" className="btn btn-ghost" onClick={handleRetake}>
              Retake Photo
            </button>
            <button type="button" className="btn btn-primary" onClick={handleContinue}>
              Use This Photo →
            </button>
          </div>
        )}

        {type === 'selfie' && (
          <div className="selfie-tips">
            <p>📸 <strong>Tips for a good photo:</strong></p>
            <ul>
              <li>Face the camera directly</li>
              <li>Ensure good lighting</li>
              <li>Keep a neutral expression</li>
            </ul>
          </div>
        )}
      </div>

      {!image && (
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
};
export default PhotoUpload;
