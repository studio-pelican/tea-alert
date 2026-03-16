"use client";

import { useState, useEffect } from "react";
import { Save, ExternalLink, Play, KeyRound, UserCircle } from "lucide-react";

export default function Home() {
  const [screenId, setScreenId] = useState("");
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    // 1. Check for token in URL hash (Implicit Grant flow)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const accessTokenFromHash = hashParams.get("access_token");

    if (accessTokenFromHash) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(accessTokenFromHash);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(2); // トークンが取得できたら自動的にStep 2へ
      // Clean up URL hash
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }

    // 2. Load existing settings
    const storedSettings = localStorage.getItem("twitcast_settings");
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.screenId) setScreenId(parsed.screenId);
        if (parsed.token && !accessTokenFromHash) {
          setToken(parsed.token);
          setStep(2); // すでにトークンがある場合もStep 2へ
        }
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        alert("先にアクセストークンを取得してください");
        return setStep(1);
    }
    localStorage.setItem(
      "twitcast_settings",
      JSON.stringify({ screenId, token })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDummyTest = () => {
    // Set a dummy gift event in localStorage to trigger the alert page
    const dummyEvent = {
        id: `dummy-${Date.now()}`,
        message: "モイ！",
        item_image: "https://twitcasting.tv/img/item/tea.png",
        item_name: "お茶",
        item_mp: 10,
        user_name: "テストユーザー",
        user_screen_name: "dummy_user",
        createdAt: Date.now()
    };
    localStorage.setItem("twitcast_dummy_event", JSON.stringify(dummyEvent));
    
    // Open alert page in another window or tell user to check it
    alert("ダミー通知を発行しました。/alert ページを開いている場合、通知が表示されます。");
  };

  // 手動でトークンを削除してやり直す処理
  const resetToken = () => {
      setToken("");
      setStep(1);
      localStorage.removeItem("twitcast_settings");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-8 transform transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <span className="text-3xl">🎁</span>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            ギフトアラート設定
          </h1>
          <p className="text-zinc-400 text-sm mt-2 text-center">
            OBSのブラウザソース用オーバーレイ
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 1 ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-zinc-800 text-zinc-400'} font-bold transition-all`}>
                1
            </div>
            <div className={`w-12 h-1 mx-2 rounded-full ${step === 2 ? 'bg-purple-600/50' : 'bg-zinc-800'} transition-all`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 2 ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-zinc-800 text-zinc-400'} font-bold transition-all`}>
                2
            </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
                  <KeyRound className="mx-auto text-purple-400 mb-2" size={32} />
                  <h2 className="text-lg font-semibold text-zinc-200">アクセストークンの取得</h2>
                  <p className="text-sm text-zinc-400 mb-4">
                      リアルタイムにギフト通知を受け取るため、ツイキャスと連携してアクセストークンを取得します。
                  </p>
                  <a
                    href="https://apiv2.twitcasting.tv/oauth2/authorize?client_id=cmizudori_pelican.47d793a262158ec742c36dfd277093c608c000a507b89f55bf689cab1a76fd0a&response_type=token"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    ツイキャスで連携する <ExternalLink size={16} />
                  </a>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <div className="text-green-400 font-medium text-sm flex items-center gap-2">
                            <KeyRound size={16} /> トークン連携済み
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">※ブラウザ内に安全に保存されています</div>
                    </div>
                    <button type="button" onClick={resetToken} className="text-xs text-red-400 hover:text-red-300 underline">
                        再連携
                    </button>
                </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 ml-1 flex items-center gap-2">
                  <UserCircle size={16} /> 配信者ID (screen_id)
                </label>
                <input
                  type="text"
                  value={screenId}
                  onChange={(e) => setScreenId(e.target.value)}
                  placeholder="例: pelicamizudori"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
                  required
                />
                <p className="text-xs text-zinc-500 ml-1">
                  通知を表示したいご自身のツイキャスIDを入力してください。
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
              >
                <Save size={18} />
                {saved ? "保存しました！" : "設定を保存して完了"}
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-800/50">
          <h2 className="text-sm font-medium text-zinc-400 mb-4 ml-1">アクション</h2>
          <div className="space-y-3">
            <button
              onClick={handleDummyTest}
              className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
              disabled={step === 1}
              style={{ opacity: step === 1 ? 0.5 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}
            >
              <Play size={16} />
              ダミー通知を送信
            </button>
            <a
              href="/alert"
              target="_blank"
              onClick={(e) => { if(step===1) e.preventDefault(); }}
              className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm block text-center"
              style={{ opacity: step === 1 ? 0.5 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ExternalLink size={16} />
              アラート画面 (OBS用) を開く
            </a>
          </div>
          <p className="mt-4 text-xs text-zinc-500 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
            <strong>OBS設定手順:</strong><br />
            1. ブラウザソースを追加<br />
            2. URLにこのサイトの <code className="text-purple-400">/alert</code> を指定<br />
            3. 幅: 1920, 高さ: 1080 に設定<br />
            4. カスタムCSSの「body &#123; background-color: rgba(0, 0, 0, 0); &#125;」はそのまま
          </p>
        </div>
      </div>
    </div>
  );
}
