'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategorySheet } from '@/components/CategorySheet';

interface RecognitionResult {
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  productName: string | null;
  confidence: number;
  decision: 'auto_proceed' | 'confirm_needed' | 'manual_select';
}

function getSessionId(): string {
  return localStorage.getItem('session_id') ?? '';
}

export default function RecognizePage() {
  const router = useRouter();
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [editedProduct, setEditedProduct] = useState('');
  const [price, setPrice] = useState('');
  const [highlights, setHighlights] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('recognition_result');
    if (!raw) { router.replace('/'); return; }
    const data = JSON.parse(raw) as RecognitionResult;
    setResult(data);
    setEditedProduct(data.productName ?? '');
    if (data.decision === 'manual_select') {
      setShowSheet(true);
    }
  }, [router]);

  const handleGenerate = async () => {
    if (!result?.categoryId) { setShowSheet(true); return; }
    setGenerating(true);

    const sessionId = getSessionId();
    const storeName = localStorage.getItem('store_name') ?? '';

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: result.categoryId,
          sessionId,
          storeName,
          product: {
            name: editedProduct || undefined,
            price: price || undefined,
            highlights: highlights || undefined,
          },
          recognitionCategoryId: result.categoryId,
          recognitionConfidence: result.confidence,
          wasRecognitionCorrected: false,
        }),
      });

      const output = await res.json();
      if (!res.ok) { alert(output.error ?? '生成失败'); setGenerating(false); return; }

      sessionStorage.setItem('generation_output', JSON.stringify(output));
      router.push(`/generate/${output.id ?? output.generationId}`);
    } catch {
      alert('网络错误，请重试');
      setGenerating(false);
    }
  };

  if (!result) return null;

  const needsConfirm = result.decision === 'confirm_needed';

  return (
    <main className="flex flex-col min-h-dvh bg-white">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg"
        >
          ‹
        </button>
        <span className="text-base font-medium text-gray-700">确认商品信息</span>
      </div>

      <div className="flex-1 px-4 space-y-4">
        <div className="rounded-2xl bg-gray-50 p-4">
          {needsConfirm && (
            <p className="text-xs text-orange-500 mb-2 font-medium">⚠️ 请确认识别结果是否正确</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{result.categoryIcon ?? '💊'}</span>
              <div>
                <p className="text-xs text-gray-400">品类</p>
                <p className="font-semibold text-gray-900">{result.categoryName ?? '未识别'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSheet(true)}
              className="text-sm text-red-500 font-medium px-3 py-1.5 rounded-lg bg-red-50"
            >
              修改
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">商品名称</label>
          <input
            value={editedProduct}
            onChange={e => setEditedProduct(e.target.value)}
            placeholder="（可选）如：汤臣倍健维生素C咀嚼片"
            className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400"
          />
        </div>

        <div>
          <button
            onClick={() => setShowExtras(!showExtras)}
            className="text-sm text-gray-400 flex items-center gap-1"
          >
            <span>补充卖点 / 价格（可选）</span>
            <span className="text-xs">{showExtras ? '▲' : '▼'}</span>
          </button>
          {showExtras && (
            <div className="mt-2 space-y-2">
              <input
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="参考价格，如：39.9"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400"
              />
              <textarea
                value={highlights}
                onChange={e => setHighlights(e.target.value)}
                placeholder="补充卖点，如：口感好，便携装，适合出差"
                rows={2}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-10 pt-4">
        <button
          onClick={handleGenerate}
          disabled={generating || !result.categoryId}
          className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-base active:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>生成中...</span>
            </>
          ) : (
            <span>✨ 生成小红书内容</span>
          )}
        </button>
      </div>

      <CategorySheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        onSelect={(cat) => {
          setResult(prev => prev ? {
            ...prev,
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            decision: 'auto_proceed',
          } : prev);
        }}
      />
    </main>
  );
}
