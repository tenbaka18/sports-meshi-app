import React, { useState, useRef, useEffect, useCallback } from 'react';

// FIX: Add type definitions for the Web Speech API (SpeechRecognition)
// The Web Speech API is not yet part of the standard TypeScript DOM typings.
// These interfaces define the necessary types for SpeechRecognition to fix compilation errors.
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition; };
    webkitSpeechRecognition: { new (): SpeechRecognition; };
  }
}

interface IngredientInputProps {
  onAnalyze: (imageFiles: File[], manualIngredients: string) => void;
  onGenerateOmakase: () => void;
  isLoading: boolean;
}

const IngredientInput: React.FC<IngredientInputProps> = ({ onAnalyze, onGenerateOmakase, isLoading }) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [manualIngredients, setManualIngredients] = useState('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textBeforeListeningRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      // FIX: The SpeechRecognitionResultList is not a true array and lacks an iterator. Convert it to an array to use a for...of loop.
      for (const result of Array.from(event.results)) {
        transcript += result[0].transcript;
      }
      const formattedTranscript = transcript.replace(/。/g, ' ').trim();
      
      const newText = [textBeforeListeningRef.current.trim(), formattedTranscript]
        .filter(Boolean)
        .join(' ');

      setManualIngredients(newText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    
    recognition.onstart = () => {
        setIsListening(true);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognitionRef.current = recognition;
    
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, []);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
        recognitionRef.current.stop();
    } else {
        textBeforeListeningRef.current = manualIngredients;
        recognitionRef.current.start();
    }
  };


  const openCamera = useCallback(async () => {
    try {
      const constraints = { video: { facingMode: cameraFacingMode } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("カメラへのアクセスに失敗しました。ブラウザの権限設定を確認してください。");
      setIsCameraModalOpen(false);
    }
  }, [cameraFacingMode]);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (isCameraModalOpen) {
      openCamera();
    } else {
      closeCamera();
    }
    return () => {
      closeCamera();
    };
  }, [isCameraModalOpen, openCamera, closeCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImageFiles(prev => [...prev, file]);
            setIsCameraModalOpen(false);
          }
        }, 'image/jpeg');
      }
    }
  };
  
  const handleSwitchCamera = () => {
    setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = () => {
    onAnalyze(imageFiles, manualIngredients);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200 space-y-6">
      <h2 className="text-xl font-bold text-amber-700 border-b-2 border-amber-200 pb-2">
        <i className="fa-solid fa-carrot mr-2"></i>
        食材を登録
      </h2>

      <div>
        <label htmlFor="manual-ingredients" className="block text-sm font-medium text-gray-700 mb-2">
            テキストで入力 <span className="text-xs text-gray-500">(食材名をスペース区切りで入力)</span>
        </label>
        <div className="relative">
            <textarea
              id="manual-ingredients"
              rows={3}
              className="w-full p-2 pr-12 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              placeholder="例: 豚肉 玉ねぎ にんじん"
              value={manualIngredients}
              onChange={(e) => setManualIngredients(e.target.value)}
              disabled={isLoading}
            />
             {recognitionRef.current && (
                <button
                    type="button"
                    onClick={handleToggleListening}
                    disabled={isLoading}
                    className={`absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center ${
                        isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    aria-label={isListening ? '音声入力を停止' : '音声で入力'}
                >
                    <i className="fa-solid fa-microphone"></i>
                </button>
            )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">写真で入力 (冷蔵庫、レシートなど)</label>
        <div className="flex items-center gap-4 flex-wrap">
            <label htmlFor="image-upload" className="cursor-pointer bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold py-2 px-4 rounded-full transition-colors">
                <i className="fa-solid fa-upload mr-2"></i>
                ファイル選択
            </label>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isLoading}
              className="hidden"
            />
            <button
                onClick={() => setIsCameraModalOpen(true)}
                disabled={isLoading}
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-full transition-colors"
            >
                <i className="fa-solid fa-camera mr-2"></i>
                カメラで撮影
            </button>
        </div>
        {imageFiles.length > 0 && (
          <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
            <strong>選択中のファイル:</strong> {imageFiles.map(f => f.name).join(', ')}
          </div>
        )}
      </div>

      <div className="text-center pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={isLoading || (imageFiles.length === 0 && manualIngredients.trim() === '')}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <i className="fa-solid fa-magnifying-glass mr-2"></i>
          食材を解析する
        </button>
        <span className="text-gray-500">または</span>
        <button
          onClick={onGenerateOmakase}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <i className="fa-solid fa-star mr-2"></i>
          おまかせで提案！
        </button>
      </div>

        {isCameraModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-4 rounded-lg shadow-xl max-w-3xl w-full">
                    <h3 className="text-lg font-bold mb-4">カメラで撮影</h3>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto max-h-[60vh] rounded-md bg-gray-900"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="flex justify-between items-center mt-4">
                        <button onClick={handleSwitchCamera} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold">
                            <i className="fa-solid fa-camera-rotate mr-2"></i>切り替え
                        </button>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsCameraModalOpen(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold">キャンセル</button>
                            <button onClick={handleCapture} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-semibold">
                                <i className="fa-solid fa-camera-retro mr-2"></i>撮影する
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default IngredientInput;