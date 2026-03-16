"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ギフトの型定義
type Gift = {
  id: string; // APIのidまたはダミー生成Id
  message: string;
  item_image: string;
  item_name: string;
  item_mp: number;
  user_name: string;
  user_screen_name: string;
  createdAt: number; // APIレスポンスにはないが、管理用に追加
};

export default function AlertPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [settings, setSettings] = useState<{ screenId: string; token: string } | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const lastSliceId = useRef<number>(-1);

  // 初回設定読み込み
  useEffect(() => {
    // URLのハッシュやクエリを見る代わりにlocalStorageを直接読む(OBSのブラウザソースは同じオリジンなら読める)
    const storedSettings = localStorage.getItem("twitcast_settings");
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error("Invalid settings JSON", e);
        setErrorInfo("設定の読み込みに失敗しました。設定画面で再保存してください。");
      }
    } else {
      setErrorInfo("設定が未登録です。設定画面を開き、配信者IDとトークンを保存してください。");
    }

    // ダミーテストの監視（StorageEventを使った別タブからの通知）
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "twitcast_dummy_event" && e.newValue) {
        try {
          const dummyGift = JSON.parse(e.newValue);
          addGiftToQueue(dummyGift);
          localStorage.removeItem("twitcast_dummy_event"); // 消費
        } catch (err) {
            console.error(err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ギフトキューへの追加と5秒後の削除
  const addGiftToQueue = (gift: Gift) => {
    setGifts((prev) => [...prev, gift]);
    
    // 5秒後にフェードアウトして消す
    setTimeout(() => {
        setGifts((prev) => prev.filter((g) => g.id !== gift.id));
    }, 5000);
  };

  // APIポーリングロジック
  useEffect(() => {
    if (!settings?.screenId || !settings?.token) return;

    let isPolling = false;

    const fetchGifts = async () => {
      if (isPolling) return;
      isPolling = true;

      try {
        // ツイキャスAPIの仕様により、/gifts で受け取る
        const res = await fetch(
          `https://apiv2.twitcasting.tv/gifts?slice_id=${lastSliceId.current}`,
          {
            headers: {
              "X-Api-Version": "2.0",
              Authorization: `Bearer ${settings.token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          // slice_id更新
          if (data.slice_id !== undefined) {
            lastSliceId.current = data.slice_id;
          }

          // 新規ギフトがあればキューに追加
          if (data.gifts && Array.isArray(data.gifts) && data.gifts.length > 0) {
              data.gifts.forEach((g: {
                id: string | number;
                message?: string;
                item_image: string;
                item_name?: string;
                item_mp?: number;
                user_name?: string;
                user_screen_name?: string;
                sender?: { name?: string; screen_name?: string };
              }) => {
                  /*
                    Twitcasting v2 format assumptions:
                    g.id: number
                    g.message: string
                    g.item_image: string
                    g.item_id: string
                    g.item_mp: number
                    g.item_name: string
                    g.sender.screen_name: string
                    g.sender.name: string
                  */
                  const gift: Gift = {
                      id: String(g.id),
                      message: g.message || "",
                      item_image: g.item_image,
                      item_name: g.item_name || "アイテム",
                      item_mp: g.item_mp || 0,
                      user_name: g.sender?.name || g.user_name || "名無し",
                      user_screen_name: g.sender?.screen_name || g.user_screen_name || "unknown",
                      createdAt: Date.now()
                  };
                  addGiftToQueue(gift);
              });
          }
          setErrorInfo(null); // エラークリア
        } else {
            console.error("API Fetch Error:", res.status, res.statusText);
            if (res.status === 401 || res.status === 403) {
                 setErrorInfo("認証エラー: トークンが無効か期限切れです。再設定してください。");
            }
        }
      } catch (err) {
        console.error("Fetch Network Error", err);
      } finally {
        isPolling = false;
      }
    };

    // 初回フェッチ
    fetchGifts();
    
    // 5秒間隔でポーリング
    const intervalId = setInterval(fetchGifts, 5000);

    return () => clearInterval(intervalId);
  }, [settings]);

  return (
    <div className="w-screen h-screen overflow-hidden pointer-events-none relative" style={{ background: "transparent" }}>
      {/* エラーメッセージ（OBSの配信者だけが見える・本番中は非表示でも良いが原因特定のため表示） */}
      {errorInfo && (
        <div className="absolute top-4 left-4 p-4 bg-red-900/80 text-white rounded-lg shadow-xl text-sm max-w-sm pointer-events-auto backdrop-blur-sm border border-red-500/50">
          <strong>Alert System Error:</strong><br />
          {errorInfo}
        </div>
      )}

      {/* アラート表示エリア (画面下部中央) */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center justify-end gap-4 p-8">
        <AnimatePresence>
          {gifts.map((gift) => (
            <motion.div
              key={gift.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700 rounded-3xl p-6 flex items-center gap-6 shadow-[0_0_40px_rgba(168,85,247,0.4)] relative overflow-hidden pointer-events-none"
            >
              {/* 光るエフェクト用背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-xl"></div>
              
              {/* アイテム画像 (跳ねるアニメーション) */}
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2, bounce: 0.6 }}
                className="relative z-10 w-24 h-24 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 p-2 shadow-inner"
              >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gift.item_image} alt={gift.item_name} className="w-full h-full object-contain filter drop-shadow-md" />
              </motion.div>

              {/* テキスト情報 */}
              <div className="relative z-10 flex flex-col text-white max-w-xl">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                    {gift.user_name}
                  </span>
                  <span className="text-zinc-300 text-lg">さんが</span>
                  <span className="text-xl font-bold text-yellow-400 px-2 py-0.5 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
                    {gift.item_name} ({gift.item_mp}MP)
                  </span>
                  <span className="text-zinc-300 text-lg">を贈りました！</span>
                </div>
                
                {gift.message && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-xl font-medium text-zinc-100 bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner"
                  >
                    &quot;{gift.message}&quot;
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
