import React from 'react';
import ClipboardImageUpload from './ClipboardImageUpload';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onError: (error: string) => void;
  bucket?: string;
  folder: string;
}

const ImageUpload: React.FC<ImageUploadProps> = (props) => {
  return (
    <ClipboardImageUpload {...props} />
  );
};

export default ImageUpload;