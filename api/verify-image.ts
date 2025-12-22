import { ImageAnnotatorClient } from '@google-cloud/vision';

const client = new ImageAnnotatorClient();

const RECEIPT_LABELS = new Set(['receipt', 'text', 'document', 'paper', 'font', 'invoice', 'bill', 'handwriting', 'material property', 'parallel']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'Image data is required' });
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const request = {
      image: {
        content: base64Image,
      },
      features: [{ type: 'LABEL_DETECTION', maxResults: 10 }],
    };

    const [result] = await client.annotateImage(request);
    const labels = result.labelAnnotations;

    if (!labels || labels.length === 0) {
      return res.status(200).json({ isReceipt: false, reason: 'Could not analyze image.' });
    }

    const foundLabels = labels.map(label => label.description?.toLowerCase() || '');
    console.log('Vision API Labels:', foundLabels);

    let isReceipt = false;
    for (const label of foundLabels) {
      if (RECEIPT_LABELS.has(label)) {
        isReceipt = true;
        break;
      }
    }

    if (isReceipt) {
      res.status(200).json({ isReceipt: true });
    } else {
      res.status(200).json({ isReceipt: false, reason: 'Image does not appear to be a receipt.' });
    }

  } catch (error) {
    console.error('Error in Google Vision API call:', error);
    res.status(500).json({ message: 'Error validating receipt', error: error.message });
  }
}
