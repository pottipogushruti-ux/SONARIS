import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileImage, X } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
const ACCEPTED_EXT = /\.(jpe?g|png|tiff?)$/i;
const MAX_SIZE_MB = 50;

export interface SelectedFile {
  file: File;
  previewUrl: string | null;
  dimensions: { width: number; height: number } | null;
}

interface Props {
  selected: SelectedFile | null;
  onSelect: (selected: SelectedFile | null) => void;
  disabled?: boolean;
}

export function UploadDropzone({ selected, onSelect, disabled }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null);

      const validType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXT.test(file.name);
      if (!validType) {
        setValidationError('Unsupported file type. Please upload JPG, PNG, or TIFF.');
        return;
      }

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_SIZE_MB) {
        setValidationError(`File is too large (${sizeMb.toFixed(1)} MB). Maximum is ${MAX_SIZE_MB} MB.`);
        return;
      }

      // Basic frontend validation only — the backend performs authoritative checks.
      const isPreviewable = file.type.startsWith('image/') && file.type !== 'image/tiff';
      const previewUrl = isPreviewable ? URL.createObjectURL(file) : null;

      if (previewUrl) {
        const img = new Image();
        img.onload = () => {
          onSelect({ file, previewUrl, dimensions: { width: img.naturalWidth, height: img.naturalHeight } });
        };
        img.onerror = () => {
          onSelect({ file, previewUrl, dimensions: null });
        };
        img.src = previewUrl;
      } else {
        onSelect({ file, previewUrl: null, dimensions: null });
      }
    },
    [onSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const clear = useCallback(() => {
    if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);
    onSelect(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [selected, onSelect]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 sm:p-12 text-center transition-colors sonar-grid-bg
          ${dragActive ? 'border-signal-400 bg-signal-500/5' : 'border-abyss-600'}
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {!selected ? (
          <>
            <UploadCloud size={36} className="text-signal-500" />
            <div>
              <p className="text-slate-200 font-medium">Upload side-scan sonar image</p>
              <p className="text-sm text-slate-500 mt-1">Drag and drop, or browse your files</p>
              <p className="text-xs text-slate-600 mt-2">Accepted: JPG, JPEG, PNG, TIFF · up to {MAX_SIZE_MB} MB</p>
            </div>
            <label className="btn-secondary mt-2 cursor-pointer">
              <FileImage size={16} />
              Browse files
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.tif,.tiff,image/jpeg,image/png,image/tiff"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                disabled={disabled}
              />
            </label>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            {selected.previewUrl ? (
              <img
                src={selected.previewUrl}
                alt="Selected sonar upload preview"
                className="max-h-56 rounded-md border border-abyss-600 object-contain"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-md border border-abyss-600 bg-abyss-850 text-slate-500">
                <FileImage size={32} />
              </div>
            )}
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="btn-ghost text-risk-high hover:text-risk-high"
            >
              <X size={14} />
              Remove file
            </button>
          </div>
        )}
      </div>

      {validationError && (
        <p role="alert" className="mt-2 text-sm text-risk-high">
          {validationError}
        </p>
      )}

      {selected && (
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <FileMeta label="Filename" value={selected.file.name} />
          <FileMeta label="File size" value={formatBytes(selected.file.size)} />
          <FileMeta
            label="Dimensions"
            value={selected.dimensions ? `${selected.dimensions.width} × ${selected.dimensions.height}px` : '—'}
          />
          <FileMeta label="Status" value="Ready to analyze" />
        </dl>
      )}
    </div>
  );
}

function FileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-3 py-2">
      <dt className="field-label">{label}</dt>
      <dd className="mt-0.5 text-slate-200 truncate" title={value}>
        {value}
      </dd>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
