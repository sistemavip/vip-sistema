import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, mimeType } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    const effectiveMime = typeof mimeType === 'string' && mimeType.length > 0 ? mimeType : 'audio/webm'
    const ext = effectiveMime.includes('mp4')
      ? 'mp4'
      : (effectiveMime.includes('mpeg') || effectiveMime.includes('mp3'))
      ? 'mp3'
      : effectiveMime.includes('ogg')
      ? 'ogg'
      : 'webm'

    console.log('Processing audio transcription... mime:', effectiveMime)
    
    const binaryAudio = processBase64Chunks(audio)
    
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: effectiveMime })
    formData.append('file', blob, `audio.${ext}`)
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('Chave de API (IA) não configurada (LOVABLE_API_KEY)');
    }

    // Se for uma chave do OpenRouter (sk-or-...), avisar que não suporta Whisper
    if (LOVABLE_API_KEY.startsWith('sk-or-')) {
      console.warn('Uso de chave OpenRouter detectado para transcrição. O OpenRouter não suporta nativamente a API de transcrição do OpenAI (Whisper).');
      return new Response(JSON.stringify({ 
        error: 'Sua chave atual é do OpenRouter, que não suporta transcrição de áudio nativamente. Para usar voz, você precisará de uma chave direta da OpenAI.' 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI gateway error:', response.status, errorText)
      throw new Error(`AI gateway error: ${errorText}`)
    }

    const result = await response.json()
    // Support both direct and wrapped response shapes
    const text = result.text ?? result?.data?.text ?? result?.result?.text
    console.log('Transcription successful:', text)

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
