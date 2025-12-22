import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { MindeeClient, documents } from 'https://deno.land/x/mindee@v5.1.1/mod.ts';

const mindeeClient = new MindeeClient({ apiKey: Deno.env.get('MINDEE_API_KEY') });

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*', // Or your specific Netlify domain for production
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    } });
  }

  try {
    const imageBuffer = await req.arrayBuffer();
    const inputSource = mindeeClient.docFromBuffer(new Uint8Array(imageBuffer), 'receipt.jpg');

    const apiResponse = await mindeeClient.parse(
      documents.ReceiptV5,
      inputSource
    );

    if (!apiResponse.document) {
      throw new Error('Failed to parse document');
    }

    const doc = apiResponse.document;
    const merchant = doc.supplierName?.value || 'N/A';
    const totalAmount = doc.totalAmount?.value || 0;

    return new Response(
      JSON.stringify({ merchant, totalAmount }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Or your specific Netlify domain for production
        },
        status: 200,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Or your specific Netlify domain for production
      },
      status: 500 
    });
  }
});
