import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, Clipboard, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ClipboardImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onError: (error: string) => void;
  bucket?: string;
  folder: string;
  className?: string;
}

const ClipboardImageUpload: React.FC<ClipboardImageUploadProps> = ({
  value,
  onChange,
  onError,
  bucket = 'mall-images',
  folder,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (!event.clipboardData) {
      onError('Clipboard access not supported');
      return;
    }
    const items = event.clipboardData.items;
    if (!items) return;

    const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    await uploadImage(file);
  }, [onError]);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length !== 1) {
      onError('Please drop exactly one image file');
      return;
    }

    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      onError('Please drop an image file');
      return;
    }

    await uploadImage(file);
  }, [onError]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      onError('Please select an image file');
      return;
    }

    await uploadImage(file);
  }, [onError]);

  const uploadImage = useCallback(async (file: File) => {
    try {
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        onError('File size limit exceeded (max 5MB)');
        return;
      }

      setIsLoading(true);
      const fileExt = file.type.split('/')[1] || 'png';
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (urlError || !publicUrl) {
        throw new Error('Failed to retrieve public URL');
      }

      onChange(publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      onError(error.message || 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  }, [bucket, folder, onChange, onError]);

  const handleRemove = useCallback(async () => {
    if (!value) return;

    try {
      const urlParts = new URL(value).pathname.split('/');
      const path = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      onChange('');
    } catch (error: any) {
      console.error('Error removing image:', error);
      onError(error.message || 'Failed to remove image');
    }
  }, [bucket, value, onChange, onError]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-500'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        ) : (
          <>
            <div className="flex justify-center space-x-2 mb-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <Clipboard className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">
              Drag & drop an image, paste from clipboard, or{' '}
              <span
                onClick={handleClick}
                className="text-blue-500 hover:underline cursor-pointer"
                role="button"
                aria-label="Add file"
              >
                add file
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 5MB
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
              aria-hidden="true"
            />
          </>
        )}
      </div>

      {value && (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove image"
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClipboardImageUpload;