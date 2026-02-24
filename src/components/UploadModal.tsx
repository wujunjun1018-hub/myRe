import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { MaterialImage } from '../types';
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
}

export default function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newFiles: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, ''),
      });
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-[var(--shadow-xl)] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in border border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-[3px] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-light)] to-[var(--color-accent)]" />

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--color-border-light)]">
          <div>
            <h2 className="text-[17px] font-bold text-[var(--color-text)]">上传素材</h2>
            <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">添加木板材质图片到资源库</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-7">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              dragOver
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] scale-[1.01]'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg)]'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-bg)] to-[var(--color-bg-warm)] flex items-center justify-center mx-auto mb-4 border border-[var(--color-border-light)]">
              <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-[var(--color-text)]">
              拖拽图片到此处，或 <span className="text-[var(--color-primary)]">点击选择文件</span>
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
              支持 JPG、PNG、WebP 格式，可批量上传
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
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[var(--color-text)]">待上传文件</span>
                <span className="text-[11px] text-[var(--color-text-tertiary)] bg-[var(--color-bg-warm)] px-2 py-0.5 rounded-md">{pendingFiles.length} 个</span>
              </div>
              {pendingFiles.map((pf, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[var(--color-surface-hover)] rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-border)] transition-colors">
                  <img src={pf.preview} alt="" className="w-14 h-14 object-cover rounded-xl shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={pf.name}
                      onChange={(e) => updatePending(idx, { name: e.target.value })}
                      className="w-full text-[13px] bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
                      placeholder="素材名称"
                    />
                  </div>
                  <button
                    onClick={() => removePending(idx)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 transition-all shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="mt-6 p-5 bg-[var(--color-primary-bg)] rounded-xl border border-[var(--color-primary)]/10 animate-fade-in">
              <div className="flex items-center justify-between text-[13px] mb-3">
                <span className="font-medium text-[var(--color-primary)] flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                  正在处理图片特征...
                </span>
                <span className="font-bold text-[var(--color-primary)] tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-[var(--color-border-light)] flex items-center justify-end gap-3 bg-[var(--color-surface-alt)]">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-5 py-2.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-xl transition-all disabled:opacity-50 border border-[var(--color-border)] hover:border-[var(--color-border-dark)] bg-white"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || pendingFiles.length === 0}
            className="px-6 py-2.5 text-[13px] font-semibold bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? '处理中...' : `上传 ${pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
