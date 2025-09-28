import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { ChefHat, Plus, ArrowLeft, Save, Utensils, Bell } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminRecipes() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    servings: '',
    prepTime: '',
    cookTime: '',
    difficulty: 'easy',
    imageUrl: '',
    tags: '',
    thankYouMessage: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch existing recipes if authenticated
  const { data: recipes, refetch: refetchRecipes } = useQuery({
    queryKey: ['/api/table/recipes'],
    enabled: isAuthenticated,
  });

  const handleLogin = () => {
    if (adminPassword) {
      setIsAuthenticated(true);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.ingredients || !formData.instructions) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in title, date, ingredients, and instructions.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Parse ingredients and instructions if they're strings
      const recipeData = {
        ...formData,
        ingredients: formData.ingredients, // Keep as string, will be processed by backend
        instructions: formData.instructions, // Keep as string, will be processed by backend
        tags: formData.tags || null,
        thankYouMessage: formData.thankYouMessage || null
      };

      const response = await apiRequest('POST', '/api/table/recipe', recipeData);

      if (response.data) {
        toast({
          title: 'Recipe Created!',
          description: `Recipe "${formData.title}" has been saved successfully.`,
        });
        
        // Clear form
        setFormData({
          date: '',
          title: '',
          description: '',
          ingredients: '',
          instructions: '',
          servings: '',
          prepTime: '',
          cookTime: '',
          difficulty: 'easy',
          imageUrl: '',
          tags: '',
          thankYouMessage: ''
        });
        
        // Refresh recipes list
        refetchRecipes();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to save recipe.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blush/10 to-white p-4">
        <div className="max-w-md mx-auto mt-20">
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ChefHat className="w-6 h-6" />
              Admin Login - Recipes
            </h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin password"
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to App
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blush/10 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ChefHat className="w-8 h-8" />
            Daily Recipes Admin
          </h1>
          <div className="flex gap-2">
            <Link href="/admin/notifications">
              <Button variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Notifications Admin
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create Recipe Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Recipe
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Recipe Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Delicious Challah Bread"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="A brief description of the recipe..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    value={formData.servings}
                    onChange={(e) => handleInputChange('servings', e.target.value)}
                    placeholder="4-6"
                  />
                </div>
                <div>
                  <Label htmlFor="prepTime">Prep Time</Label>
                  <Input
                    id="prepTime"
                    value={formData.prepTime}
                    onChange={(e) => handleInputChange('prepTime', e.target.value)}
                    placeholder="30 min"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime">Cook Time</Label>
                  <Input
                    id="cookTime"
                    value={formData.cookTime}
                    onChange={(e) => handleInputChange('cookTime', e.target.value)}
                    placeholder="45 min"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ingredients">Ingredients * (one per line)</Label>
                <Textarea
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => handleInputChange('ingredients', e.target.value)}
                  placeholder="3 cups flour&#10;1 tsp salt&#10;2 eggs&#10;1/4 cup oil"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions * (numbered steps)</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="1. Mix dry ingredients in a large bowl&#10;2. Add wet ingredients and mix well&#10;3. Knead dough for 10 minutes"
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/recipe-image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="kosher, pareve, shabbat, easy"
                />
              </div>

              <div>
                <Label htmlFor="thankYouMessage">Thank You Message</Label>
                <Textarea
                  id="thankYouMessage"
                  value={formData.thankYouMessage}
                  onChange={(e) => handleInputChange('thankYouMessage', e.target.value)}
                  placeholder="Special thanks to [Chef Sarah](https://example.com) for providing this amazing recipe."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports markdown links: [text](url). Leave empty to use default Kosher.com message.
                </p>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isSaving || !formData.title || !formData.date}
                className="w-full"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Recipe
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Recent Recipes */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Recent Recipes
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {recipes && recipes.length > 0 ? (
                recipes.slice(0, 10).map((recipe: any) => (
                  <div key={recipe.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{recipe.title}</p>
                        <p className="text-xs text-gray-600">{recipe.date}</p>
                        {recipe.thankYouMessage && (
                          <p className="text-xs text-blue-600 mt-1">
                            Custom thank you message: {recipe.thankYouMessage.substring(0, 50)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {recipe.difficulty && (
                        <span className="capitalize">{recipe.difficulty}</span>
                      )}
                      {recipe.prepTime && (
                        <span>Prep: {recipe.prepTime}</span>
                      )}
                      {recipe.cookTime && (
                        <span>Cook: {recipe.cookTime}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recipes created yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}