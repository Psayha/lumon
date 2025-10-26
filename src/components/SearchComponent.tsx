import React, { useState, useTransition, useDeferredValue } from 'react';
import { Search } from 'lucide-react';
import { Input } from './Input';
import { Card } from './Card';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
}

const SearchComponent: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const handleSearch = (value: string) => {
    startTransition(() => {
      setQuery(value);
    });
  };

  // Моковые данные для демонстрации
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Оркестратор процессов',
      description: 'Автоматизация бизнес-процессов с помощью AI',
      category: 'Автоматизация'
    },
    {
      id: '2',
      title: 'AI Агенты',
      description: 'Интеллектуальные помощники для задач',
      category: 'AI'
    },
    {
      id: '3',
      title: 'Аналитика данных',
      description: 'Отчеты и метрики производительности',
      category: 'Аналитика'
    }
  ];

  const filteredResults = mockResults.filter(result =>
    result.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
    result.description.toLowerCase().includes(deferredQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Input
          value={query}
          onChange={handleSearch}
          placeholder="Поиск по платформе..."
          label="Поиск"
          className="relative"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {deferredQuery && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Результаты поиска
          </h3>
          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <Card key={result.id} variant="outlined" padding="md">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {result.description}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full">
                      {result.category}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card variant="outlined" padding="md">
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Ничего не найдено по запросу "{deferredQuery}"
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
