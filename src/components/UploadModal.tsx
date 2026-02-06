import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CATEGORIES, type Category, type MaterialImage } from '../types';
import { extractFeatures, loadImageAsImageData, createThumbnail } from '../utils/imageFeatures';
import { saveImage } from '../utils/db';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

interface PendingFile {
  file: File;
  preview: string;
  name: string;
  category: Category;
}

export default function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newFiles: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: '其他',
      });
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removePending = (index: number) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updatePending = (index: number, updates: Partial<PendingFile>) => {
    setPendingFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setProgress(0);

    for (let i = 0; i < pendingFiles.length; i++) {
      const pf = pendingFiles[i];
      try {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(pf.file);
        });

        const { imageData, width, height } = await loadImageAsImageData(dataUrl);
        const features = extractFeatures(imageData);
        const thumbnail = await createThumbnail(dataUrl);

        const id = uuidv4();
        const image: MaterialImage = {
          id,
          name: pf.name,
          category: pf.category,
          tags: [],
          thumbnail,
          blobKey: `blob-${id}`,
          features,
          createdAt: Date.now(),
          width,
          height,
          fileSize: pf.file.size,
        };

        await saveImage(image, pf.file);
      } catch (err) {
        console.error('Failed to process image:', pf.name, err);
      }
      setProgress(((i + 1) / pendingFiles.length) * 100);
    }

    // Cleanup
    pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
    setPendingFiles([]);
    setUploading(false);
    setProgress(0);
    onUploaded();
    onClose();
  };

  const handleClose = () => {
    if (uploading) return;
    pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
    setPendingFiles([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">上传素材</h2>
          <button onClick={handleClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-xl">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <svg className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-[var(--color-text-secondary)]">
              拖拽图片到此处，或点击选择文件
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              支持 JPG、PNG、WebP 格式
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* Pending files */}
          {pendingFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              {pendingFiles.map((pf, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[var(--color-surface-hover)] rounded-lg">
                  <img src={pf.preview} alt="" className="w-14 h-14 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={pf.name}
                      onChange={(e) => updatePending(idx, { name: e.target.value })}
                      className="w-full text-sm bg-white border border-[var(--color-border)] rounded px-2 py-1 mb-1 focus:outline-none focus:border-[var(--color-primary)]"
                      placeholder="素材名称"
                    />
                    <select
                      value={pf.category}
                      onChange={(e) => updatePending(idx, { category: e.target.value as Category })}
                      className="text-xs bg-white border border-[var(--color-border)] rounded px-2 py-1 focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      {CATEGORIES.filter((c) => c !== '全部').map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removePending(idx)}
                    className="text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                <span>正在处理...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-[var(--color-surface-hover)] rounded-full h-2">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">
            {pendingFiles.length} 个文件待上传
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || pendingFiles.length === 0}
              className="px-6 py-2 text-sm font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
            >
              {uploading ? '处理中...' : '上传'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
