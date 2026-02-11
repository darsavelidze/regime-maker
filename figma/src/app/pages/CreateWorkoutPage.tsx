import { useState } from "react";

export function CreateWorkoutPage() {
  const [activeTab, setActiveTab] = useState<"workout" | "note">("workout");
  const [selectedDay, setSelectedDay] = useState(1);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-white rounded-2xl overflow-hidden">
        <button
          onClick={() => setActiveTab("workout")}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === "workout"
              ? "bg-white border-b-2 border-black"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          ТРЕНИРОВКА
        </button>
        <button
          onClick={() => setActiveTab("note")}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === "note"
              ? "bg-white border-b-2 border-black"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          ЗАМЕТКА
        </button>
      </div>

      {/* Form */}
      {activeTab === "workout" && (
        <div className="bg-white rounded-2xl p-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 uppercase">
              Название
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Periodic Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-gray-700">Периодичная тренировка</span>
          </label>

          {/* Training Days */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 uppercase">
              Дней тренировок
            </label>
            <div className="relative">
              <select className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black appearance-none">
                <option>3</option>
                <option>1</option>
                <option>2</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
                <option>7</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 uppercase">
              Дата начала
            </label>
            <input
              type="text"
              placeholder="02/11/2026"
              className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Exercise Days */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 uppercase">
              Упражнения по дням
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedDay === day
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  День {day}
                </button>
              ))}
            </div>
          </div>

          {/* Empty Exercise State */}
          <div className="py-12 text-center">
            <p className="text-gray-600">Нет упражнений</p>
          </div>
        </div>
      )}

      {activeTab === "note" && (
        <div className="bg-white rounded-2xl p-6">
          <textarea
            placeholder="Введите заметку..."
            className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black min-h-[200px] resize-none"
          />
        </div>
      )}
    </div>
  );
}
