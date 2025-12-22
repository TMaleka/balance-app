import { useState, useRef } from 'react';
import { Camera, Loader, TrendingUp, CheckCircle, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { MerchantRecognitionEngine, MerchantCandidate } from '../utils/merchantRecognition';

interface CameraViewProps {
  onReceiptScanned: (candidates: MerchantCandidate[], amount: number) => void;
  onTabChange: () => void;
}

export default function CameraView({ onReceiptScanned, onTabChange }: CameraViewProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageQualityError, setImageQualityError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setIsScanning(true);
          setImageQualityError(null);
        } catch (playErr) {
          console.error("Error attempting to play video:", playErr);
          nedbank-alert("Could not start the camera video. Please try again.");
        }
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      nedbank-alert(`Could not access the camera: ${message}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Image quality validation function
  const validateImageQuality = (canvas: HTMLCanvasElement): { isValid: boolean; error?: string } => {
    const context = canvas.getContext('2d');
    if (!context) return { isValid: false, error: 'Could not process image' };

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check image size
    if (canvas.width < 300 || canvas.height < 300) {
      return { isValid: false, error: 'Image too small. Please move closer to the receipt.' };
    }

    // Check brightness (too dark images)
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
    }
    const avgBrightness = totalBrightness / (data.length / 4);

    if (avgBrightness < 50) {
      return { isValid: false, error: 'Image too dark. Please ensure good lighting.' };
    }

    if (avgBrightness > 240) {
      return { isValid: false, error: 'Image too bright. Avoid direct flash or bright lights.' };
    }

    return { isValid: true };
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    // Validate image quality
    const qualityCheck = validateImageQuality(canvas);
    if (!qualityCheck.isValid) {
      setImageQualityError(qualityCheck.error || 'Image quality issue');
      return;
    }

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  const handleConfirmImage = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setCapturedImage(null);

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const { data, error } = await supabase.functions.invoke('receipt-ocr', {
        body: blob,
      });

      if (error) throw error;

      // Get user location for enhanced recognition
      let location;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      } catch (err) {
        console.log('Location not available, proceeding without geolocation');
      }

      // Apply multi-layered merchant recognition
      const merchantCandidates = await MerchantRecognitionEngine.recognizeMerchant({
        merchant: data.merchant,
        totalAmount: data.totalAmount,
        rawText: data.rawText,
        lines: data.lines
      }, location);

      onReceiptScanned(merchantCandidates, data.totalAmount);

    } catch (err) {
      console.error('Error invoking OCR function:', err);
      const message = err instanceof Error ? err.message : String(err);
      nedbank-alert(`Failed to process receipt: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setImageQualityError(null);
    startCamera();
  };

  // Processing screen
  if (isProcessing) {
    return (
      <div className="bg-black">
        <Loader className="w-16 h-16 animate-spin" />
        <p className="text-xl">Analyzing Receipt...</p>
        <p className="text-sm opacity-70 mt-2">This may take a few seconds</p>
      </div>
    );
  }

  // Image quality error screen
  if (imageQualityError) {
    return (
      <div className="bg-blacktext-center">
        <div className="w-16 h-16 bg-red-500 rounded-full">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-red-400">Image Quality Issue</h2>
        <p className="text-lg">{imageQualityError}</p>
        <button
          onClick={() => {
            setImageQualityError(null);
            startCamera();
          }}
          className="py-3 bg-blue-600font-semibold hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Image confirmation screen
  if (capturedImage) {
    return (
      <div className="bg-black">
        <div className="absolute toright-4 z-10">
          <button 
            onClick={onTabChange}
            className="w-12 h-12bg-opacity-20hover:bg-opacity-30 transition-colors"
          >
            <TrendingUp className="w-6 h-6" />
          </button>
        </div>

        <div className="-grow flex">
          <img 
            src={capturedImage} 
            alt="Captured receipt" 
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="bg-blacktext-center">
          <h2 className="text-xl font-bold mb-2">Is this a receipt?</h2>
          <p className="text-sm opacity-70">Please confirm this image shows a clear receipt before processing</p>
          
          <div className="space-x-4">
            <button
              onClick={handleRetakePhoto}
              className="-1 max-w-32 px-4 py-3 bg-gray-600font-semibold hover:bg-gray-700 transition-colors"
            >
              Retake
            </button>
            <button
              onClick={handleConfirmImage}
              className="-1 max-w-32 px-4 py-3 bg-green-600font-semibold hover:bg-green-700 transition-colors flexspace-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Process</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main camera screen
  return (
    <div className="bg-black">
      <div className="absolute toright-4 z-10">
        <button 
          onClick={onTabChange}
          className="w-12 h-12bg-opacity-20hover:bg-opacity-30 transition-colors"
        >
          <TrendingUp className="w-6 h-6" />
        </button>
      </div>

      <div className="-grow relative flex">
        <video 
          ref={videoRef}
          className={`w-full h-full object-cover ${isScanning ? '' : 'hidden'}`}
          autoPlay 
          playsInline 
          muted 
        />
        {!isScanning && (
          <div className="text-center">
            <h1 className="text-3xl font-bold">Receipt Scanner</h1>
            <div className="space-y-2 text-lg opacity-80">
              <p>📄 Point camera at receipt</p>
              <p>💡 Ensure good lighting</p>
              <p>📏 Fill the frame with receipt</p>
            </div>
            <p className="text-sm opacity-60">Tap the camera button to start</p>
          </div>
        )}

        {isScanning && (
          <div className="absolute toleft-4 bg-black bg-opacity-50px-3 py-2text-sm">
            <p>📄 Position receipt in frame</p>
            <p>💡 Ensure good lighting</p>
          </div>
        )}

        <div className="absolute inset-0-8 border-white border-opacity-50 rounded-3xl m-8 pointer-events-none"></div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className="bg-black">
        <button
          onClick={isScanning ? handleCapture : startCamera}
          className="w-20 h-20rounded-fullshadow-lg transform transition-transform hover:scale-110"
        >
          <Camera className="w-10 h-10 text-black" />
        </button>
        {isScanning && (
          <p className="text-sm mt-2 opacity-70">Tap to capture</p>
        )}
      </div>
    </div>
  );
}
