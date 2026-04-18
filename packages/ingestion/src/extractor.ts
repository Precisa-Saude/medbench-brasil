import { extractBytes } from '@kreuzberg/node';

/**
 * Wrapper sobre @kreuzberg/node — mesmo padrão do
 * `@kreuzberg/node` wrapper.
 *
 * Tentativa 1: extração direta (PDFs digitais).
 * Tentativa 2: fallback para OCR Tesseract em `por+eng` quando o conteúdo
 * retornado for vazio ou curto demais (PDFs escaneados).
 */

export class OcrExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OcrExtractionError';
  }
}

export interface PageContent {
  content: string;
  pageNumber: number;
}

export interface ExtractionResult {
  pageContents: PageContent[];
  pages: number;
  text: string;
}

const MIN_CONTENT_LENGTH = 20;

export async function extractPdfText(buffer: Buffer): Promise<ExtractionResult> {
  const config = { pages: { extractPages: true } };

  let result = await extractBytes(buffer, 'application/pdf', config);
  const hasContent = result.content && result.content.trim().length > MIN_CONTENT_LENGTH;

  if (!hasContent) {
    try {
      result = await extractBytes(buffer, 'application/pdf', {
        ...config,
        forceOcr: true,
        ocr: { backend: 'tesseract', language: 'por+eng' },
      });
    } catch (ocrError) {
      throw new OcrExtractionError(
        `OCR Tesseract falhou ao processar PDF baseado em imagem: ${
          ocrError instanceof Error ? ocrError.message : String(ocrError)
        }`,
      );
    }
  }

  const pageContents: PageContent[] = (result.pages ?? []).map((page) => ({
    content: page.content,
    pageNumber: page.pageNumber,
  }));

  return {
    pageContents,
    pages: result.metadata?.page_count ?? pageContents.length,
    text: result.content ?? '',
  };
}
