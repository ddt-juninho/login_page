import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Download, Check, QrCode } from 'lucide-react';

interface RegistrationQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrationQrModal({
  isOpen,
  onClose,
}: RegistrationQrModalProps) {
  const [copied, setCopied] = React.useState(false);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // URL pública dinâmica (funciona tanto em localhost como no domínio publicado)
  const registrationUrl = `${window.location.origin}/`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback caso clipboard esteja bloqueado
    }
  };

  const handleDownloadPng = () => {
    const svgElement = svgWrapperRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const size = 600;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 30, 30, size - 60, size - 60);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qrcode-inscricao-mk.png';
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 space-y-5 text-center"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>QR Code de Inscrição</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-zinc-300">
            Aponta a câmara do telemóvel para abrir diretamente a ficha de inscrição:
          </p>

          {/* Fundo branco obrigatório para leitura rápida em qualquer câmara */}
          <div
            ref={svgWrapperRef}
            className="mx-auto w-fit p-4 bg-white rounded-2xl border-4 border-amber-500"
          >
            <QRCodeSVG
              value={registrationUrl}
              size={210}
              bgColor="#ffffff"
              fgColor="#09090b"
              level="M"
            />
          </div>

          <p className="text-[11px] font-mono text-zinc-400 break-all pt-1">
            {registrationUrl}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold border border-zinc-700 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copiar Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPng}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}