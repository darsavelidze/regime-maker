import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarPage() {
  const [currentDate] = useState(new Date(2026, 1, 11)); // February 2026

  const daysInMonth = new Date(2026, 2, 0).getDate();
  const firstDay = new Date(2026, 1, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const workoutDays = [2, 5, 8, 11, 14, 17, 20, 23, 26];
  const selectedDay = 11;

  const weekDays = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 space-y-4 max-w-md">
        {/* Month Header */}
        <div className="flex items-center justify-between">
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold">Февраль 2026</h2>
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-600">
          {weekDays.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const hasWorkout = workoutDays.includes(day);
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                  hasWorkout
                    ? isSelected
                      ? "bg-[#8B0000] text-white border-2 border-black"
                      : "bg-[#8B0000] text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Selected Date Info */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-gray-700 font-medium mb-2 text-sm">2026-02-11</div>
          <div className="text-xs text-gray-600 mb-3">Выполнено 0 из 1</div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-600">
              0
            </div>
            <div className="flex-1 text-gray-700 text-sm">
              1. Подтягивания (Pull Ups): 3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}