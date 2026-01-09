"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  className?: string;
}

export function ImageDropzone({
  onFileSelect,
  selectedFile,
  className,
}: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelect(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemove = () => {
    onFileSelect(null);
    setPreview(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {selectedFile && preview ? (
        <div className="relative group">
          <div className="relative w-full h-96 rounded-lg overflow-hidden border border-white/10">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 end-2 p-2 bg-deep-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-deep-black"
              aria-label="Remove image"
            >
              <X className="w-4 h-4 text-off-white" />
            </button>
          </div>
          <p className="mt-2 text-sm text-off-white/70 text-center">
            {selectedFile.name}
          </p>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "relative w-full h-96 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
            "flex flex-col items-center justify-center gap-4 p-8",
            isDragActive
              ? "border-gold bg-gold/5"
              : "border-white/20 hover:border-gold/50 hover:bg-white/5",
            className,
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 text-center">
            {isDragActive ? (
              <>
                <Upload className="w-12 h-12 text-gold" />
                <p className="text-lg font-medium text-gold">Drop image here</p>
              </>
            ) : (
              <>
                <div className="p-4 rounded-full bg-white/5 border border-white/10">
                  <ImageIcon className="w-8 h-8 text-gold" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-off-white">
                    Drag & drop your room photo
                  </p>
                  <p className="text-sm text-off-white/60">
                    or click to browse (max 10MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

