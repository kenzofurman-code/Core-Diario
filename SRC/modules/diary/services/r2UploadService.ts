// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — SERVIÇO DE STORAGE CLOUDFLARE R2
// Armazenamento S3-Compatible com Zero Egress e CDN Global via Backend/Worker
// =====================================================================

import { R2StorageConfig } from '../types/diary.types';
import { MediaStorageService } from './mediaStorageService';

export interface R2UploadResult {
  publicUrl: string;
  r2Key: string;
  isLocalFallback: boolean;
  sizeBytes: number;
  uploadedAt: string;
  errorMessage?: string;
}

export class R2UploadService {
  /**
   * Valida se a configuração do R2 possui o endpoint seguro ou domínio preenchido
   */
  public static isConfigured(config: R2StorageConfig): boolean {
    return Boolean(
      config.enabled &&
      (config.uploadEndpointUrl?.trim() || (config.accountId?.trim() && config.bucketName?.trim()))
    );
  }

  /**
   * Formata a chave/caminho pericial do objeto dentro do bucket R2
   * Estrutura: obras/{codigoObra}/{ano}/{mes}/{data}_{id}.jpg
   */
  public static generateObjectKey(
    projectCode: string,
    reportDate: string,
    locationName?: string
  ): string {
    const cleanProject = projectCode.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'obra';
    const dateObj = new Date(reportDate || Date.now());
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const timestamp = Date.now();
    const cleanLocation = locationName
      ? locationName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)
      : 'geral';
    
    return `obras/${cleanProject}/${year}/${month}/${day}_${cleanLocation}_${timestamp}.jpg`;
  }

  /**
   * Testa a conectividade com o endpoint de upload / Worker
   */
  public static async testConnection(
    config: R2StorageConfig
  ): Promise<{ success: boolean; message: string; details?: string }> {
    if (!config.enabled) {
      return { success: false, message: 'Armazenamento em nuvem R2 está desativado.' };
    }

    if (!config.uploadEndpointUrl?.trim()) {
      return {
        success: false,
        message: 'Endpoint de Upload (Cloudflare Worker ou Webhook n8n) não configurado.',
      };
    }

    try {
      const headers: Record<string, string> = {};
      if (config.apiKey?.trim()) {
        headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
      }

      // Faz requisição de teste para o endpoint de upload
      const response = await fetch(config.uploadEndpointUrl.trim(), {
        method: 'OPTIONS',
        headers,
      }).catch(async () => {
        // Fallback para GET se OPTIONS não for suportado
        return await fetch(config.uploadEndpointUrl!.trim(), {
          method: 'GET',
          headers,
        });
      });

      if (response.ok || response.status === 204 || response.status === 405) {
        return {
          success: true,
          message: 'Endpoint de upload Cloudflare R2 conectado com sucesso!',
          details: `Endpoint: ${config.uploadEndpointUrl} | Bucket: ${config.bucketName || 'padrão'}`,
        };
      }

      return {
        success: false,
        message: `Endpoint retornou status HTTP ${response.status}.`,
        details: 'Verifique se o Worker ou webhook n8n está rodando na VPS.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Não foi possível conectar ao endpoint de upload.',
        details: err?.message || String(err),
      };
    }
  }

  /**
   * Converte DataURL Base64 em Blob para upload otimizado
   */
  public static dataUrlToBlob(dataUrl: string): Blob {
    return MediaStorageService.dataUrlToBlob(dataUrl);
  }

  /**
   * Realiza o envio da foto com carimbo para o Cloudflare R2
   * Se o endpoint remoto não responder ou estiver offline, faz fallback
   * seguro e transparente para o IndexedDB local (sem estourar o localStorage).
   */
  public static async uploadPhoto(
    imageSource: string | Blob,
    params: {
      projectCode: string;
      reportDate: string;
      locationName: string;
      config: R2StorageConfig;
    }
  ): Promise<R2UploadResult> {
    const { projectCode, reportDate, locationName, config } = params;
    const objectKey = this.generateObjectKey(projectCode, reportDate, locationName);
    const nowIso = new Date().toISOString();

    let blob: Blob;
    let dataUrlString: string;

    if (typeof imageSource === 'string') {
      dataUrlString = imageSource;
      blob = this.dataUrlToBlob(imageSource);
    } else {
      blob = imageSource;
      dataUrlString = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    const sizeBytes = blob.size;

    // Persiste imediatamente no IndexedDB local para garantia de contingência offline
    const localIndexedDbUrl = await MediaStorageService.saveMedia(objectKey, blob);

    // Se o R2 não estiver configurado com endpoint ativo, retorna o fallback local do IndexedDB
    if (!this.isConfigured(config) || !config.uploadEndpointUrl?.trim()) {
      return {
        publicUrl: localIndexedDbUrl,
        r2Key: objectKey,
        isLocalFallback: true,
        sizeBytes,
        uploadedAt: nowIso,
        errorMessage: 'Upload R2 não configurado. Foto persistida localmente com alta fidelidade.',
      };
    }

    try {
      // Envia os bytes reais via FormData para o endpoint seguro (Worker / n8n)
      const formData = new FormData();
      formData.append('file', blob, `${objectKey.split('/').pop()}`);
      formData.append('r2Key', objectKey);
      formData.append('projectCode', projectCode);
      formData.append('reportDate', reportDate);
      formData.append('locationName', locationName);

      const headers: Record<string, string> = {};
      if (config.apiKey?.trim()) {
        headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
      }

      const response = await fetch(config.uploadEndpointUrl.trim(), {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload HTTP falhou com status ${response.status}`);
      }

      const resJson = await response.json();
      const publicUrl = resJson.publicUrl ||
        (config.publicDomainUrl
          ? `${config.publicDomainUrl.replace(/\/+$/, '')}/${objectKey}`
          : localIndexedDbUrl);

      return {
        publicUrl,
        r2Key: objectKey,
        isLocalFallback: false,
        sizeBytes,
        uploadedAt: nowIso,
      };
    } catch (err: any) {
      console.warn('[R2UploadService] Upload remoto falhou, ativando contingência IndexedDB:', err);
      return {
        publicUrl: localIndexedDbUrl,
        r2Key: objectKey,
        isLocalFallback: true,
        sizeBytes,
        uploadedAt: nowIso,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
