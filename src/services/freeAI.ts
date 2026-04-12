/**
 * Servizio per AI gratuite alternative (Ollama locale, HuggingFace free tier)
 * Da usare come fallback per Gemini quando si vuole risparmiare sui costi API
 */

export interface FreeAIOptions {
  provider: 'ollama' | 'huggingface';
  model?: string;
  endpoint?: string;
  timeout?: number;
}

export interface FreeAIResponse {
  text: string;
  tokensUsed: number;
  duration: number;
  provider: string;
  model: string;
}

const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';

const HUGGINGFACE_FREE_MODELS = {
  'mistral': 'mistralai/Mistral-7B-Instruct-v0.3',
  'llama': 'meta-llama/Meta-Llama-3-8B-Instruct',
  'phi': 'microsoft/Phi-3-mini-4k-instruct',
};

/**
 * Chiama un modello Ollama locale (gratuito, richiede Ollama installato)
 * Documentazione: https://github.com/ollama/ollama/blob/main/docs/api.md
 */
export async function callOllama(
  prompt: string,
  options: Omit<FreeAIOptions, 'provider'> = {}
): Promise<FreeAIResponse> {
  const endpoint = options.endpoint || DEFAULT_OLLAMA_ENDPOINT;
  const model = options.model || DEFAULT_OLLAMA_MODEL;
  const timeout = options.timeout || 30000;

  const startTime = Date.now();

  try {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    return {
      text: data.response || '',
      tokensUsed: data.eval_count || 0,
      duration,
      provider: 'ollama',
      model,
    };
  } catch (error) {
    throw new Error(`Ollama call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Chiama un modello HuggingFace Inference API (free tier disponibile)
 * Documentazione: https://huggingface.co/docs/api-inference
 */
export async function callHuggingFace(
  prompt: string,
  options: Omit<FreeAIOptions, 'provider'> & { apiKey?: string } = {}
): Promise<FreeAIResponse> {
  const model = options.model || 'mistralai/Mistral-7B-Instruct-v0.3';
  const apiKey = options.apiKey;
  const timeout = options.timeout || 30000;

  const startTime = Date.now();

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false,
          },
        }),
        signal: AbortSignal.timeout(timeout),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    // HuggingFace returns array of results
    const text = Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || '';

    return {
      text,
      tokensUsed: 0, // HF free API non riporta token count
      duration,
      provider: 'huggingface',
      model,
    };
  } catch (error) {
    throw new Error(`HuggingFace call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifica se Ollama è disponibile localmente
 */
export async function checkOllamaAvailability(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT
): Promise<{ available: boolean; models?: string[]; error?: string }> {
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { available: false, error: `Status: ${response.status}` };
    }

    const data = await response.json();
    const models = data.models?.map((m: any) => m.name) || [];

    return { available: true, models };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Genera contenuto usando AI gratuita con fallback automatico
 * Prima prova Ollama locale, poi HuggingFace
 */
export async function generateFreeContent(
  prompt: string,
  options: FreeAIOptions = { provider: 'ollama' }
): Promise<FreeAIResponse> {
  if (options.provider === 'ollama') {
    try {
      return await callOllama(prompt, options);
    } catch (ollamaError) {
      console.warn('Ollama non disponibile, fallback a HuggingFace:', ollamaError);
      return await callHuggingFace(prompt, options);
    }
  }

  return await callHuggingFace(prompt, options);
}

/**
 * Utility per formattare prompt per prodotti DJ
 */
export function formatProductPrompt(
  productName: string,
  task: 'description' | 'specs' | 'seo' | 'image_search'
): string {
  const prompts = {
    description: `Sei un esperto di attrezzatura DJ e audio professionale.
Scrivi una descrizione professionale per: ${productName}
- Massimo 800 caratteri
- Tono tecnico ma accessibile
- Evidenzia benefici per DJ
- In italiano`,

    specs: `Sei un esperto di attrezzatura DJ.
Estrai specifiche tecniche per: ${productName}
Formato JSON:
{
  "watt": "...",
  "frequency": "...",
  "inputs": "...",
  "outputs": "...",
  "dimensions": "...",
  "weight": "..."
}
Usa "N/A" se un dato non è disponibile.`,

    seo: `Sei un esperto SEO per e-commerce DJ.
Genera per ${productName}:
- Titolo SEO (max 60 caratteri)
- Meta description (max 160 caratteri)
- 5 parole chiave
Formato JSON`,

    image_search: `Trova immagini ufficiali di: ${productName}
Cerca su sfondo bianco, alta risoluzione, foto prodotto professionale.`,
  };

  return prompts[task];
}
