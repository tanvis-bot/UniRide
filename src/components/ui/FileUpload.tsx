import React, { useRef, useState } from 'react';
import { FileCheck2Icon, UploadCloudIcon, XIcon } from 'lucide-react';
import type { UploadDescriptor } from '../../services/api';

interface FileUploadProps {
  label: string;
  hint?: string;
  value: UploadDescriptor | null;
  onChange: (file: UploadDescriptor | null) => void;
  accept?: string;
}

/**
 * Client half of the Multer upload flow: validates type and size, previews the
 * file, and hands the server a descriptor. In production this posts
 * multipart/form-data and the server streams it to Cloudinary.
 */
export function FileUpload({
  label,
  hint = 'JPG, PNG or PDF · up to 5 MB',
  value,
  onChange,
  accept = 'image/jpeg,image/png,application/pdf'
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const sizeMb = file.size / (1024 * 1024);
    if (!accept.split(',').includes(file.type)) {
      setError('Only JPG, PNG or PDF files are accepted.');
      return;
    }
    if (sizeMb > 5) {
      setError('File must be smaller than 5 MB.');
      return;
    }
    setError(null);
    onChange({
  name: file.name,
  type: file.type,
  sizeMb: Number(sizeMb.toFixed(2)),
  previewUrl: file.type.startsWith('image/')
    ? URL.createObjectURL(file)
    : undefined,
  file
});
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink-800">{label}</p>
      {value ?
      <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3.5">
          <FileCheck2Icon className="h-5 w-5 shrink-0 text-brand-700" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{value.name}</p>
            <p className="text-xs text-slate-500">{value.sizeMb} MB</p>
          </div>
          <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Remove ${value.name}`}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-ink-900">
          
            <XIcon className="h-4 w-4" />
          </button>
        </div> :

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center transition-colors duration-150 ease-out hover:border-brand-400 hover:bg-brand-50/40">
        
          <UploadCloudIcon className="h-6 w-6 text-slate-400" aria-hidden />
          <span className="text-sm font-semibold text-ink-900">
            Choose a file to upload
          </span>
          <span className="text-xs text-slate-500">{hint}</span>
        </button>
      }
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])} />
      
      {error && <p className="text-xs font-medium text-signal-red">{error}</p>}
    </div>);

}