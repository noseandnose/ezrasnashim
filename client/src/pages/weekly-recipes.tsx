import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Utensils, ChefHat } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { getLocalDateString } from "@/lib/dateUtils";
import type { DailyRecipe } from "@shared/schema";

function formatRecipeDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbos'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function formatTimeDisplay(time: string): string {
  if (!time) return '';
  const num = parseInt(time);
  if (!isNaN(num)) {
    if (num >= 60) {
      const hours = Math.floor(num / 60);
      const mins = num % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${num} min`;
  }
  return time;
}

function formatTextContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

export default function WeeklyRecipes() {
  const [, setLocation] = useLocation();
  const [selectedRecipe, setSelectedRecipe] = useState<DailyRecipe | null>(null);
  const today = getLocalDateString();

  const { data: recipes, isLoading } = useQuery<DailyRecipe[]>({
    queryKey: [`/api/table/recipes/week?date=${today}`],
    staleTime: 5 * 60 * 1000,
  });

  if (selectedRecipe) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => setSelectedRecipe(null)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-black" />
            </button>
            <h1 className="platypi-bold text-lg text-black ml-2 flex-1 truncate">{selectedRecipe.title}</h1>
          </div>
        </div>

        <div className="pb-24">
          {selectedRecipe.imageUrl && (
            <div className="w-full aspect-video overflow-hidden">
              <img
                src={selectedRecipe.imageUrl}
                alt={selectedRecipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="px-4 py-4 space-y-4">
            <h2 className="platypi-bold text-xl text-black">{selectedRecipe.title}</h2>

            {selectedRecipe.description && (
              <p className="platypi-regular text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: formatTextContent(selectedRecipe.description) }} />
            )}

            {(selectedRecipe.totalTime || selectedRecipe.servings || selectedRecipe.difficulty) && (
              <div className="flex gap-4 text-sm text-gray-600">
                {selectedRecipe.totalTime && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatTimeDisplay(selectedRecipe.totalTime)}</span>
                  </div>
                )}
                {selectedRecipe.servings && (
                  <div className="flex items-center gap-1">
                    <Utensils size={14} />
                    <span>{selectedRecipe.servings}</span>
                  </div>
                )}
                {selectedRecipe.difficulty && (
                  <div className="flex items-center gap-1">
                    <ChefHat size={14} />
                    <span>{selectedRecipe.difficulty}</span>
                  </div>
                )}
              </div>
            )}

            {selectedRecipe.ingredients && (
              <div>
                <h3 className="platypi-bold text-base text-black mb-2">Ingredients</h3>
                <div className="space-y-1.5">
                  {(() => {
                    if (typeof selectedRecipe.ingredients === 'string') {
                      try {
                        const parsed = JSON.parse(selectedRecipe.ingredients);
                        if (Array.isArray(parsed)) {
                          return parsed.map((ing: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-blush mt-1">•</span>
                              <span className="platypi-regular text-sm text-black">{ing}</span>
                            </div>
                          ));
                        }
                      } catch {}
                      return (selectedRecipe.ingredients as string).split('\n').filter(Boolean).map((line, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-blush mt-1">•</span>
                          <span className="platypi-regular text-sm text-black">{line.replace(/^[-•]\s*/, '')}</span>
                        </div>
                      ));
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}

            {selectedRecipe.instructions && (
              <div>
                <h3 className="platypi-bold text-base text-black mb-2">Instructions</h3>
                <div className="space-y-3">
                  {(() => {
                    if (typeof selectedRecipe.instructions === 'string') {
                      try {
                        const parsed = JSON.parse(selectedRecipe.instructions);
                        if (Array.isArray(parsed)) {
                          return parsed.map((step: string, i: number) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="platypi-bold text-sm text-blush min-w-[20px]">{i + 1}.</span>
                              <span className="platypi-regular text-sm text-black">{step}</span>
                            </div>
                          ));
                        }
                      } catch {}
                      return (selectedRecipe.instructions as string).split('\n').filter(Boolean).map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="platypi-bold text-sm text-blush min-w-[20px]">{i + 1}.</span>
                          <span className="platypi-regular text-sm text-black">{step.replace(/^\d+[.)]\s*/, '')}</span>
                        </div>
                      ));
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}

            {selectedRecipe.thankYouMessage && (
              <div className="mt-6 p-4 bg-blush/10 rounded-xl">
                <p className="platypi-regular text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: formatTextContent(selectedRecipe.thankYouMessage) }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => setLocation('/life')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-black" />
          </button>
          <div className="ml-2">
            <h1 className="platypi-bold text-lg text-black">Weekly Recipes</h1>
            <p className="platypi-regular text-xs text-gray-500">Dinner Ideas and a Dessert</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-24" />
            ))}
          </div>
        ) : !recipes || recipes.length === 0 ? (
          <div className="text-center py-12">
            <Utensils size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="platypi-medium text-gray-500">No recipes this week</p>
            <p className="platypi-regular text-sm text-gray-400 mt-1">Check back soon for new recipes!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => {
              const isToday = recipe.date === today;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="w-full text-left rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: isToday ? 'rgba(232, 180, 188, 0.15)' : 'rgba(255, 255, 255, 0.95)',
                    border: isToday ? '2px solid rgba(232, 180, 188, 0.4)' : '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <div className="flex items-center gap-3 p-3">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-blush/20 flex items-center justify-center flex-shrink-0">
                        <Utensils size={24} className="text-blush" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`platypi-medium text-xs ${isToday ? 'text-pink-600' : 'text-gray-500'}`}>
                          {formatRecipeDate(recipe.date)}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 platypi-bold text-[0.6rem]">TODAY</span>
                        )}
                      </div>
                      <h3 className="platypi-bold text-sm text-black truncate">{recipe.title}</h3>
                      {recipe.description && (
                        <p className="platypi-regular text-xs text-gray-500 mt-0.5 line-clamp-2">{recipe.description.replace(/\*\*/g, '')}</p>
                      )}
                      {(recipe.totalTime || recipe.difficulty) && (
                        <div className="flex items-center gap-3 mt-1.5 text-gray-400">
                          {recipe.totalTime && (
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span className="text-[0.65rem]">{formatTimeDisplay(recipe.totalTime)}</span>
                            </div>
                          )}
                          {recipe.difficulty && (
                            <div className="flex items-center gap-1">
                              <ChefHat size={10} />
                              <span className="text-[0.65rem] capitalize">{recipe.difficulty}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}