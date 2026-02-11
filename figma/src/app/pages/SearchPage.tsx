import { Search } from "lucide-react";

export function SearchPage() {
  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Поиск тренировок и пользователей..."
          className="w-full pl-12 pr-4 py-3 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
      <div className="text-center py-12">
        <p className="text-gray-500">Начните вводить для поиска</p>
      </div>
    </div>
  );
}
