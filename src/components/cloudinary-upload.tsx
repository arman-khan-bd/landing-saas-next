
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon, Plus } from "lucide-react";

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  onRemove: (url: string) => void;
  value?: string | string[];
  multiple?: boolean;
}

export function CloudinaryUpload({ onUpload, onRemove, value, multiple = false }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    // Process files one by one for simplicity
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "krishi-bazar");

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/dj7pg5slk/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          onUpload(data.secure_url);
          if (!multiple) break; // Only one for single upload
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
    
    setIsUploading(false);
  };

  const renderSingle = () => {
    const url = typeof value === "string" ? value : "";
    return (
      <div className="relative w-full aspect-video bg-muted rounded-2xl overflow-hidden border-2 border-dashed border-border group">
        {url ? (
          <>
            <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="destructive" size="icon" className="rounded-full" onClick={() => onRemove(url)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50 transition-colors">
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs font-medium text-muted-foreground">Upload Image</span>
              </>
            )}
            <input type="file" className="hidden" onChange={handleUpload} accept="image/*" disabled={isUploading} />
          </label>
        )}
      </div>
    );
  };

  const renderMultiple = () => {
    const urls = Array.isArray(value) ? value : [];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {urls.map((url, idx) => (
          <div key={idx} className="relative aspect-square bg-muted rounded-xl overflow-hidden border border-border group">
            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => onRemove(url)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border rounded-xl bg-white hover:bg-muted/30 transition-colors cursor-pointer group">
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : (
            <Plus className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition-transform" />
          )}
          <input type="file" className="hidden" onChange={handleUpload} multiple accept="image/*" disabled={isUploading} />
        </label>
      </div>
    );
  };

  return multiple ? renderMultiple() : renderSingle();
}
