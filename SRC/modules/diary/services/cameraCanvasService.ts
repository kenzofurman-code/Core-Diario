// =====================================================================
// UTILITÁRIO DE CÂMERA & PROCESSAMENTO CANVAS COM CARIMBO D'ÁGUA REAL
// Grava indelevelmente GPS, data, hora, obra e responsável na foto
// =====================================================================

export interface PhotoMetadata {
  projectCode: string;
  projectName: string;
  location: string;
  authorName: string;
  timestamp?: string;
  gpsCoordinates?: string;
}

export class CameraCanvasService {
  /**
   * Obtém as coordenadas GPS reais do dispositivo via Geolocation API
   */
  public static async getCoordinates(fallbackGps?: string): Promise<string> {
    const defaultCoords = fallbackGps?.trim() || 'Coordenadas não disponíveis';

    if (typeof window === 'undefined' || !navigator.geolocation) {
      return defaultCoords;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          resolve(`${lat}, ${lng}`);
        },
        () => {
          // Fallback para as coordenadas cadastradas no projeto
          resolve(defaultCoords);
        },
        { timeout: 3500, enableHighAccuracy: true }
      );
    });
  }

  /**
   * Queima a marca d'água oficial no canvas e retorna a imagem em base64
   */
  public static async burnWatermark(
    imageSource: HTMLImageElement | HTMLVideoElement,
    metadata: PhotoMetadata
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const width = (imageSource as HTMLVideoElement).videoWidth || imageSource.width || 1280;
    const height = (imageSource as HTMLVideoElement).videoHeight || imageSource.height || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível obter o contexto 2D do Canvas.');

    // 1. Desenha a foto original
    ctx.drawImage(imageSource, 0, 0, width, height);

    // 2. Altura da tarja preta inferior
    const bannerHeight = Math.max(90, Math.round(height * 0.14));
    const bannerY = height - bannerHeight;

    // Fundo gradiente/sólido
    ctx.fillStyle = 'rgba(10, 14, 20, 0.88)';
    ctx.fillRect(0, bannerY, width, bannerHeight);

    // Linha de acento amarelo/laranja ConstruKore
    ctx.fillStyle = '#B4640F';
    ctx.fillRect(0, bannerY, width, 4);

    // 3. Textos do Carimbo
    const paddingX = Math.round(width * 0.03);
    const dateObj = metadata.timestamp ? new Date(metadata.timestamp) : new Date();
    const dateStr = dateObj.toLocaleDateString('pt-BR');
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour12: false });
    const gpsStr = metadata.gpsCoordinates || (await this.getCoordinates());

    // Linha 1: Nome da Obra e Local
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(bannerHeight * 0.22)}px 'IBM Plex Sans', Inter, sans-serif`;
    ctx.fillText(
      `CONSTRUKORE | OBRA: ${metadata.projectCode} • ${metadata.location.toUpperCase()}`,
      paddingX,
      bannerY + bannerHeight * 0.35
    );

    // Linha 2: Data, Hora e GPS
    ctx.fillStyle = '#C9D3DE';
    ctx.font = `${Math.round(bannerHeight * 0.18)}px 'IBM Plex Mono', monospace`;
    ctx.fillText(
      `DATA: ${dateStr}   HORA: ${timeStr}   GPS: ${gpsStr}`,
      paddingX,
      bannerY + bannerHeight * 0.65
    );

    // Linha 3: Responsável / Autoria
    ctx.fillStyle = '#9AA0AA';
    ctx.font = `${Math.round(bannerHeight * 0.16)}px 'IBM Plex Sans', sans-serif`;
    ctx.fillText(
      `RESPONSÁVEL: ${metadata.authorName} • EVIDÊNCIA FOTOGRÁFICA INALTERÁVEL`,
      paddingX,
      bannerY + bannerHeight * 0.90
    );

    return canvas.toDataURL('image/jpeg', 0.92);
  }
}
