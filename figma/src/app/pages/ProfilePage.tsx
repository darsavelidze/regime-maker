import { useState } from "react";
import { MoreVertical, BarChart3 } from "lucide-react";

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"workouts" | "notes" | "followers" | "following">("workouts");
  const [menuOpen, setMenuOpen] = useState(false);
  const [inReaction, setInReaction] = useState(false);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
            N
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">nastuha</h2>
            <p className="text-gray-600">Бобер</p>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Выйти
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-around pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">1</div>
            <div className="text-sm text-gray-600">тренировок</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-gray-600">IN</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">1</div>
            <div className="text-sm text-gray-600">подписчиков</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">1</div>
            <div className="text-sm text-gray-600">подписок</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("workouts")}
            className={`flex-1 py-3 text-center ${
              activeTab === "workouts"
                ? "border-b-2 border-black font-medium"
                : "text-gray-500"
            }`}
          >
            ТРЕНИРОВКИ
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 py-3 text-center ${
              activeTab === "notes"
                ? "border-b-2 border-black font-medium"
                : "text-gray-500"
            }`}
          >
            ЗАМЕТКИ
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-3 text-center ${
              activeTab === "followers"
                ? "border-b-2 border-black font-medium"
                : "text-gray-500"
            }`}
          >
            ПОДПИСЧИКИ
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-center ${
              activeTab === "following"
                ? "border-b-2 border-black font-medium"
                : "text-gray-500"
            }`}
          >
            ПОДПИСКИ
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "workouts" && (
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">asdf (2)</h3>
                  <span className="text-xs text-gray-500">
                    3 дн · пауза 0 дн · с 2026-02-11
                  </span>
                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                    Публичная
                  </span>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-10">
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Анализ
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                        Редактировать
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-gray-700">1. Подтягивания (Pull Ups): 3</div>
                <div className="text-sm text-gray-500">Нет упражнений</div>
                <div className="text-sm text-gray-500">Нет упражнений</div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setInReaction(!inReaction)}
                  className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
                    inReaction 
                      ? "bg-black text-white" 
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  IN
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-2">Заметка о тренировке</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Сегодня отличная тренировка! Увеличил вес в подтягиваниях.
                    Чувствую прогре��с, продолжаю работать над техникой.
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 pt-2">11 февраля 2026</div>
            </div>
          </div>
        )}

        {activeTab === "followers" && (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                S
              </div>
              <div className="flex-1">
                <h3 className="font-medium">sandro</h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === "following" && (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                S
              </div>
              <div className="flex-1">
                <h3 className="font-medium">sandro</h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}