import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Download, Check, QrCode, Globe } from 'lucide-react';
import DragonEmblem from './DragonEmblem';

interface RegistrationQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// URL pública global padrão caso o admin abra o painel a partir de localhost
const FALLBACK_PUBLIC_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL || 'https://login-page-ddt-juninho.vercel.app';

function getInitialGlobalUrl(): string {
  if (typeof window === 'undefined') return `${FALLBACK_PUBLIC_URL}/`;
  const origin = window.location.origin;
  const isLocal =
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.startsWith('http://192.168.') ||
    origin.startsWith('http://10.');

  if (isLocal) {
    return `${FALLBACK_PUBLIC_URL.replace(/\/$/, '')}/`;
  }
  return `${origin}/`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function RegistrationQrModal({
  isOpen,
  onClose,
}: RegistrationQrModalProps) {
  const [copied, setCopied] = useState(false);
  const [registrationUrl, setRegistrationUrl] = useState<string>(() =>
    getInitialGlobalUrl()
  );
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  const handleDownloadPng = () => {
    const svgElement = svgWrapperRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const qrImg = new Image();

    const width = 760;
    const height = 980;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    qrImg.onload = () => {
      // 1. Fundo escuro principal (#09090b)
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // 2. Cartão interno (#18181b) com borda dourada (#f59e0b)
      const pad = 36;
      const cardW = width - pad * 2;
      const cardH = height - pad * 2;

      drawRoundedRect(ctx, pad, pad, cardW, cardH, 36);
      ctx.fillStyle = '#18181b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.stroke();

      // 3. Faixa dourada superior de destaque
      ctx.save();
      drawRoundedRect(ctx, pad, pad, cardW, cardH, 36);
      ctx.clip();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(pad, pad, cardW, 12);
      ctx.restore();

      // 4. Emblema vetorial do Dragão desenhado direto no Canvas
      const cx = width / 2;
      const cy = 132;
      ctx.beginPath();
      ctx.arc(cx, cy, 44, 0, Math.PI * 2);
      ctx.fillStyle = '#09090b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MK', cx, cy + 2);

      // 5. Badge superior
      const badgeW = 310;
      const badgeH = 38;
      drawRoundedRect(ctx, cx - badgeW / 2, 202, badgeW, badgeH, 19);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = '800 15px sans-serif';
      ctx.fillText('INSCRIÇÃO OFICIAL • MK ARENA', cx, 222);

      // 6. Título principal
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px sans-serif';
      ctx.fillText('CAMPEONATO DE', cx, 286);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 44px sans-serif';
      ctx.fillText('MORTAL KOMBAT', cx, 336);

      // 7. Subtítulo instrutivo
      ctx.fillStyle = '#d4d4d8';
      ctx.font = '500 20px sans-serif';
      ctx.fillText('Aponta a câmara do teu telemóvel para entrar', cx, 392);

      // 8. Moldura branca com borda dourada para o QR Code
      const qrBoxSize = 370;
      const qrBoxX = cx - qrBoxSize / 2;
      const qrBoxY = 426;

      drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      const qrMargin = 26;
      ctx.drawImage(
        qrImg,
        qrBoxX + qrMargin,
        qrBoxY + qrMargin,
        qrBoxSize - qrMargin * 2,
        qrBoxSize - qrMargin * 2
      );

      // 9. Caixa com o link global no fundo do card
      const linkBoxW = cardW - 96;
      const linkBoxH = 54;
      const linkBoxX = cx - linkBoxW / 2;
      const linkBoxY = 828;

      drawRoundedRect(ctx, linkBoxX, linkBoxY, linkBoxW, linkBoxH, 14);
      ctx.fillStyle = '#09090b';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#27272a';
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 17px monospace';
      const displayUrl =
        registrationUrl.length > 46
          ? `${registrationUrl.slice(0, 43)}...`
          : registrationUrl;
      ctx.fillText(displayUrl, cx, linkBoxY + linkBoxH / 2 + 1);

      // 10. Rodapé do Card
      ctx.fillStyle = '#71717a';
      ctx.font = '600 15px sans-serif';
      ctx.fillText('Organização UniTiva • Garante a tua vaga na arena', cx, 912);

      // Exporta e faz o download do Card completo em PNG
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'convite-qrcode-mortal-kombat.png';
      downloadLink.click();
    };

    qrImg.src =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgData)));
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
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>QR Code Oficial</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pré-visualização estilo Card do Torneio */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col items-center gap-1.5">
            <DragonEmblem className="w-10 h-10" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              Campeonato de Mortal Kombat
            </span>
            <p className="text-xs text-zinc-300">
              Aponta a câmara do telemóvel para abrir a ficha de inscrição:
            </p>
          </div>

          {/* QR Code com fundo branco para leitura rápida */}
          <div
            ref={svgWrapperRef}
            className="mx-auto w-fit p-3.5 bg-white rounded-2xl border-4 border-amber-500"
          >
            <QRCodeSVG
              value={registrationUrl || 'https://vercel.app'}
              size={200}
              bgColor="#ffffff"
              fgColor="#09090b"
              level="M"
            />
          </div>

          {/* Campo do Link Público Global */}
          <div className="text-left space-y-1 pt-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-amber-400" />
              <span>Link Público Global (Destino do QR)</span>
            </label>
            <input
              type="url"
              value={registrationUrl}
              onChange={(e) => setRegistrationUrl(e.target.value)}
              placeholder="https://teu-site.vercel.app/"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-2.5">
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
            <span>Baixar Card PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}