"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  onRemove: () => void;
  value?: string;
}

export function CloudinaryUpload({ onUpload, onRemove, value }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "krishi-bazar"); // Cloudinary preset

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dj7pg5slk/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        // Extract just the public ID or relative path if using next/image loader
        // For simplicity with the 'cloudinary' loader in next.config, 
        // we might just need the relative path from the upload.
        onUpload(data.secure_url);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full aspect-video bg-muted rounded-2xl overflow-hidden border-2 border-dashed border-border group">
          <img
            src={value}
            alt="Uploaded content"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="destructive" size="icon" className="rounded-full" onClick={onRemove}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border rounded-2xl bg-white hover:bg-muted/30 transition-colors cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            ) : (
              <>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="mb-2 text-sm text-foreground font-bold">
                  Click to upload image
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (Max. 5MB)</p>
              </>
            )}
          </div>
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept="image/*" />
        </label>
      )}
    </div>
  );
}
