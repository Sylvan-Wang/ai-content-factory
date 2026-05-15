'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ContentOutput {
  title: string;
  coverTextOptions: string[];
  body: string;
  tags: string[];
  complianceFlags?: Array<{ word: string; severity: string }>;
  parseError?: boolean;
}

interface GenerationOutput {
  id?: string;
  generationId?: string;
  content?: ContentOutput;
  title?: string;
  body?: string;
  tags?: string[];
  coverText?: string;
  hookTypeUsed: string;
  templateTypeUsed: string;
  personaUsed: string;
  sceneUsed: string;
  metadata: { provider: string; model: string; latencyMs: number };
}

function getSessionId(): string {
  return localStorage.getItem('session_id') ?? '';
}

export default function GeneratePage() {
  const router = useRouter();

  const [output, setOutput] = useState<GenerationOutput | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTags, setEditTags] = useState('');
  const [hasEdited, setHasEdited] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateCount, setRegenerateCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const lastHookTypeRef = useRef<string>('');
  const lastTemplateTypeRef = useRef<string>('');

  useEffect(() => {
    const raw = sessionStorage.getItem('generation_output');
    if (!raw) { router.replace('/'); return; }
    const data = JSON.parse(raw) as GenerationOutput;
    applyOutput(data);
  }, [router]);

  const applyOutput = (data: GenerationOutput) => {
    setOutput(data);
    // Support both structured content and flat mock format
    const title = data.content?.title ?? data.title ?? '';
    const body = data.content?.body ?? data.body ?? '';
    const tags = data.content?.tags ?? data.tags ?? [];
    setEditTitle(title);
    setEditBody(body);
    setEditTags(tags.join(' '));
    setHasEdited(false);
    lastHookTypeRef.current = data.hookTypeUsed;
    lastTemplateTypeRef.current = data.templateTypeUsed;
  };

  const handleCopy = async () => {
    const text = [editTitle, '', editBody, '', editTags].join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopyState('copied');
    setShowSuccess(true);
    const sessionId = getSessionId();
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'interaction', sessionId, action: 'copy_all', wasEdited: hasEdited }),
    });
    setTimeout(() => { setCopyState('idle'); setShowSuccess(false); }, 2000);
  };

  const handleRegenerate = async () => {
    if (hasEdited) {
      const ok = confirm('替换后当前修改会清空，继续吗？');
      if (!ok) return;
    }
    setRegenerating(true);
    const recognitionRaw = sessionStorage.getItem('recognition_result');
    const recognition = recognitionRaw ? JSON.parse(recognitionRaw) : {};
    const sessionId = getSessionId();
    const storeName = localStorage.getItem('store_name') ?? '';
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: recognition.categoryId,
          sessionId,
          storeName,
          product: { name: recognition.productName || undefined },
          lastHookType: lastHookTypeRef.current,
          lastTemplateType: lastTemplateTypeRef.current,
          sessionHistory: [{ templateTypeUsed: lastTemplateTypeRef.current }],
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? '生成失败'); return; }
      sessionStorage.setItem('generation_output', JSON.stringify(data));
      applyOutput(data);
      setRegenerateCount(c => c + 1);
    } catch {
      alert('网络错误，请重试');
    } finally {
      setRegenerating(false);
    }
  };

  if (!output) return null;

  const complianceFlags = output.content?.complianceFlags ?? [];
  const coverTextOptions = output.content?.coverTextOptions ?? (output.coverText ? [output.coverText] : []);

  return (
    <main className="flex flex-col min-h-dvh bg-white">
      <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">‹</button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400 truncate">{output.personaUsed} · {output.sceneUsed}</p>
        </div>
        {regenerateCount > 0 && <span className="text-xs text-gray-300">换了 {regenerateCount} 次</span>}
      </div>

      {complianceFlags.length > 0 && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
          <p className="text-xs text-orange-600 font-medium">⚠️ 检测到 {complianceFlags.length} 处需注意：{complianceFlags.map((f: { word: string }) => f.word).join('、')}</p>
          <p className="text-xs text-orange-400 mt-0.5">发布前请检查或修改相关内容</p>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-4 pb-32">
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium">📌 标题</p>
          <textarea value={editTitle} onChange={e => { setEditTitle(e.target.value); setHasEdited(true); }} rows={2} className="w-full text-base font-semibold text-gray-900 leading-relaxed bg-gray-50 rounded-xl px-3 py-3 outline-none focus:bg-red-50 resize-none" />
        </div>

        {coverTextOptions.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">🖼 封面文字</p>
            <div className="space-y-1.5">
              {coverTextOptions.map((opt: string, i: number) => (
                <div key={i} className="px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-700 font-medium">{opt}</div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium">📝 正文</p>
          <textarea value={editBody} onChange={e => { setEditBody(e.target.value); setHasEdited(true); }} rows={6} className="w-full text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl px-3 py-3 outline-none focus:bg-red-50 resize-none" />
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium">🏷 话题标签</p>
          <textarea value={editTags} onChange={e => { setEditTags(e.target.value); setHasEdited(true); }} rows={2} className="w-full text-sm text-blue-500 leading-relaxed bg-gray-50 rounded-xl px-3 py-3 outline-none focus:bg-red-50 resize-none" />
        </div>

        <div className="text-xs text-gray-300 space-y-0.5">
          <p>模型：{output.metadata.provider} / {output.metadata.model} · {output.metadata.latencyMs}ms</p>
          <p>模板：{output.templateTypeUsed} · 钩子：{output.hookTypeUsed}</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 py-3 bg-white border-t border-gray-100 safe-bottom">
        <div className="flex gap-3">
          <button onClick={handleRegenerate} disabled={regenerating} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 active:bg-gray-50 disabled:opacity-60 flex items-center justify-center gap-1">
            {regenerating ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : '🔄 换一个'}
          </button>
          <button onClick={handleCopy} className={`flex-[2] py-3.5 rounded-2xl text-sm font-bold transition-all ${copyState === 'copied' ? 'bg-green-500 text-white' : 'bg-red-500 text-white active:bg-red-600'}`}>
            {copyState === 'copied' ? '✓ 已复制！' : '📋 一键复制全部'}
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 text-white px-6 py-4 rounded-2xl text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-base font-bold">去小红书粘贴就能发！</p>
          </div>
        </div>
      )}
    </main>
  );
}
