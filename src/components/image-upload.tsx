"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
}

export function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      onSuccess={(result) => {
        if (result.info && typeof result.info !== "string" && result.info.secure_url) {
          onUploadSuccess(result.info.secure_url);
        }
      }}
    >
      {({ open }) => {
        return (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => open()}
            className="flex items-center gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Image
          </Button>
        );
      }}
    </CldUploadWidget>
  );
}
