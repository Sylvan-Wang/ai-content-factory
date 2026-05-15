'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CategorySheet } from '@/components/CategorySheet';
import { nanoid } from 'nanoid';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('session_id');
  if (!sid) {
    sid = nanoid();
    localStorage.setItem('session_id', sid);
  }
  return sid;
}

function getStoreName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('store_name') ?? '';
}

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [editingStore, setEditingStore] = useState(false);
  const [storeInput, setStoreInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setStoreName(getStoreName());
    if (!getStoreName()) {
      setTimeout(() => setEditingStore(true), 800);
    }
  }, []);

  const handlePhotoCapture = async (file: File) => {
    setUploading(true);
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.8,
      });

      const base64 = await fileToBase64(compressed);
      const sessionId = getSessionId();

      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, sessionId }),
      });
      const data = await res.json();

      sessionStorage.setItem('recognition_result', JSON.stringify({
        ...data,
        imageBase64: base64,
      }));

      router.push('/recognize');
    } catch (err) {
      console.error(err);
      alert('识别失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoCapture(file);
    e.target.value = '';
  };

  const handleStoreNameSave = () => {
    const name = storeInput.trim();
    setStoreName(name);
    localStorage.setItem('store_name', name);
    setEditingStore(false);
  };

  return (
    <main className="flex flex-col min-h-dvh bg-white">
      <div className="px-4 pt-12 pb-2">
        {editingStore ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={storeInput}
              onChange={e => setStoreInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStoreNameSave()}
              placeholder="填写门店名称（可选）"
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-red-400"
            />
            <button
              onClick={handleStoreNameSave}
              className="text-sm text-red-500 font-medium px-2"
            >
              确定
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setStoreInput(storeName); setEditingStore(true); }}
            className="flex items-center gap-1 text-sm text-gray-400"
          >
            {storeName ? (
              <>
                <span className="text-gray-700">{storeName}</span>
                <span className="text-xs">✏️</span>
              </>
            ) : (
              <span>填写门店名，内容更有本地特色 →</span>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full max-w-xs flex flex-col items-center gap-4 py-12 px-8 rounded-3xl bg-red-50 active:bg-red-100 active:scale-95 transition-all disabled:opacity-60"
        >
          {uploading ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-base font-medium text-red-500">识别中...</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                <span className="text-4xl">📸</span>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">拍张照</p>
                <p className="text-sm text-gray-400 mt-1">对准商品，30秒出稿</p>
              </div>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => setShowSheet(true)}
          className="mt-8 text-sm text-gray-400 underline underline-offset-2"
        >
          没有商品在手？选个品类 →
        </button>
      </div>

      <CategorySheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        onSelect={(cat) => {
          sessionStorage.setItem('recognition_result', JSON.stringify({
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            productName: null,
            confidence: 1,
            decision: 'manual_select',
          }));
          router.push('/recognize');
        }}
      />
    </main>
  );
}

async function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
