"use client";

import { useState, useRef } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFile = (selected: File) => {
    if (selected.type !== "application/pdf") {
      setStatus("error");
      setErrorMessage("Only PDF files are supported.");
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setStatus("error");
      setErrorMessage("File exceeds the 10 MB limit.");
      setFile(null);
      return;
    }
    setFile(selected);
    setStatus("idle");
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) selectFile(e.target.files[0]);
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) selectFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus("idle");
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 500);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
      onUploadComplete?.();
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center space-y-4 cursor-pointer transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-primary/20 hover:bg-muted/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-primary/10 p-4 rounded-full">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Click to upload or drag and drop</p>
            <p className="text-sm text-muted-foreground mt-1">PDF documents only (max 10 MB)</p>
          </div>
          {status === "error" && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />
        </div>
      ) : (
        <div className="border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploading && status !== "success" && (
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground animate-pulse">
                Uploading and extracting document...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-500/10 p-3 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Document uploaded successfully! Processing in background.</span>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!uploading && status !== "success" && (
            <Button onClick={handleUpload} className="w-full">
              Upload Document
            </Button>
          )}

          {status === "success" && (
            <Button variant="outline" onClick={clearFile} className="w-full">
              Upload Another
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
