"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRef } from "react";

export function UploadButton({
  onSelect,
}: {
  onSelect: (files: FileList) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            onSelect(e.target.files);
          }
        }}
      />

      <Button
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
      >
        <Plus className="h-5 w-5" />
      </Button>
    </>
  );
}
