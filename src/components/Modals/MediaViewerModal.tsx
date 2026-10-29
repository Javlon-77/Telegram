import React from 'react';
import { X, Download } from 'lucide-react';

interface MediaViewerModalProps {
  mediaUrl: string | null;
  fileName?: string;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  mediaUrl,
  fileName,
  onClose,
}) => {
  if (!mediaUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <a
          href={mediaUrl}
          download={fileName || 'telecrypt_download'}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl flex items-center justify-center shadow-2xl">
        <img
          src={mediaUrl}
          alt={fileName || 'Preview'}
          className="max-h-[85vh] max-w-full object-contain"
        />
      </div>
    </div>
  );
};
