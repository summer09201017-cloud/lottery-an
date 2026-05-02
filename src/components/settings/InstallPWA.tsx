import { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, ChevronDown, MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type Platform = 'ios' | 'android-chrome' | 'desktop' | 'other';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  if (isIOS) return 'ios';
  if (/Android/i.test(ua)) return 'android-chrome';
  if (/Windows|Mac|Linux|CrOS/i.test(ua)) return 'desktop';
  return 'other';
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    setPlatform(detectPlatform());

    // Detect already-installed (standalone) state across browsers
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari standalone flag
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleClick = async () => {
    // Native install prompt path (Android Chrome / Desktop Chrome / Edge)
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') setIsInstalled(true);
      return;
    }
    // Otherwise show platform-specific manual guide
    setShowGuide(true);
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 mt-4 w-full justify-center rounded-lg bg-emerald-900/40 text-emerald-300 text-sm border border-emerald-700">
        <Smartphone className="w-4 h-4" /> 已安裝為 App
      </div>
    );
  }

  const buttonLabel =
    platform === 'ios'
      ? '安裝到 iPhone / iPad'
      : platform === 'android-chrome'
      ? '安裝到手機桌面'
      : platform === 'desktop'
      ? '安裝為電腦 App'
      : '安裝此應用程式';

  return (
    <>
      <button
        onClick={handleClick}
        className={clsx(
          'flex items-center gap-2 px-4 py-3 mt-4 w-full justify-center rounded-lg font-bold transition-all shadow-lg',
          'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98]'
        )}
      >
        <Download className="w-5 h-5" /> {buttonLabel}
      </button>

      {showGuide && (
        <InstallGuideModal platform={platform} onClose={() => setShowGuide(false)} />
      )}
    </>
  );
}

interface GuideProps {
  platform: Platform;
  onClose: () => void;
}

function InstallGuideModal({ platform, onClose }: GuideProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-emerald-400" />
          安裝抽獎機到主畫面
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          安裝後可離線使用、全螢幕開啟、像原生 App 一樣方便。
        </p>

        {platform === 'ios' && <IOSSteps />}
        {platform === 'android-chrome' && <AndroidSteps />}
        {platform === 'desktop' && <DesktopSteps />}
        {platform === 'other' && <GenericSteps />}

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500 text-white text-sm font-black flex items-center justify-center">
        {n}
      </span>
      <div className="flex-1 text-gray-200 text-sm leading-relaxed pt-0.5">{children}</div>
    </li>
  );
}

function IOSSteps() {
  return (
    <ol className="flex flex-col gap-4">
      <Step n={1}>
        請務必使用 <strong className="text-white">Safari 瀏覽器</strong> 開啟此頁面（Chrome on iOS 不支援安裝）
      </Step>
      <Step n={2}>
        點擊螢幕下方（或上方）的{' '}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 rounded text-white">
          <Share className="w-4 h-4" /> 分享
        </span>{' '}
        圖示
      </Step>
      <Step n={3}>
        在彈出選單向下捲動，選擇{' '}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-white">
          <PlusSquare className="w-4 h-4" /> 加入主畫面
        </span>
      </Step>
      <Step n={4}>
        右上角點擊 <strong className="text-white">「加入」</strong>，桌面上就會出現抽獎機 App 圖示！
      </Step>
    </ol>
  );
}

function AndroidSteps() {
  return (
    <ol className="flex flex-col gap-4">
      <Step n={1}>
        請使用 <strong className="text-white">Chrome 或 Edge</strong> 開啟此頁面
      </Step>
      <Step n={2}>
        點擊瀏覽器右上角的{' '}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-white">
          <MoreVertical className="w-4 h-4" /> 選單
        </span>
      </Step>
      <Step n={3}>
        選擇 <strong className="text-white">「安裝應用程式」</strong> 或{' '}
        <strong className="text-white">「加到主畫面」</strong>
      </Step>
      <Step n={4}>
        確認安裝，桌面就會出現獨立 App 圖示！
      </Step>
      <li className="text-xs text-gray-500 mt-2">
        💡 若看到「安裝」橫幅，直接點擊即可。
      </li>
    </ol>
  );
}

function DesktopSteps() {
  return (
    <ol className="flex flex-col gap-4">
      <Step n={1}>
        在 <strong className="text-white">Chrome / Edge</strong> 網址列右側找{' '}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-white">
          <Download className="w-4 h-4" /> 安裝
        </span>{' '}
        圖示
      </Step>
      <Step n={2}>
        點擊圖示，再按「安裝」即可建立桌面捷徑與獨立視窗
      </Step>
      <Step n={3}>
        若無圖示，從瀏覽器選單{' '}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-white">
          <ChevronDown className="w-4 h-4" /> ⋮
        </span>{' '}
        中選擇「儲存並分享 → 安裝此頁面」
      </Step>
    </ol>
  );
}

function GenericSteps() {
  return (
    <div className="text-sm text-gray-300 leading-relaxed">
      <p className="mb-3">
        您的瀏覽器目前未提供自動安裝。請開啟瀏覽器選單，尋找「
        <strong className="text-white">安裝應用程式</strong>」或「
        <strong className="text-white">加到主畫面</strong>」選項。
      </p>
      <p className="text-xs text-gray-500">
        建議改用最新版 Chrome、Edge 或 Safari (iOS) 取得完整安裝體驗。
      </p>
    </div>
  );
}
