import { useState } from "react";
import { MoreVertical, BarChart3 } from "lucide-react";

export function WorkoutsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [inReaction, setInReaction] = useState(false);
  
  const workouts = [
    {
      id: 1,
      title: "asdf",
      count: 2,
      isPrivate: true,
      daysSince: 3,
      pauseDays: 0,
      createdDate: "2026-02-11",
      author: "@sandro",
      exercises: ["1. Подтягивания (Pull Ups): 3", "Нет упражнений", "Нет упражнений"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="bg-white rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Мои тренировки</h1>
      </div>

      {workouts.map((workout) => (
        <div key={workout.id} className="bg-white rounded-2xl p-6 space-y-3 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">
                {workout.title} ({workout.count})
              </h3>
              <span className="text-xs text-gray-500">
                {workout.daysSince} дн · пауза {workout.pauseDays} дн · с {workout.createdDate}
              </span>
              <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                {workout.isPrivate ? "Приватная" : "Публичная"}
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
            {workout.exercises.map((exercise, idx) => (
              <div key={idx} className={`text-sm ${idx === 0 ? "text-gray-700" : "text-gray-500"}`}>
                {exercise}
              </div>
            ))}
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
      ))}
    </div>
  );
}