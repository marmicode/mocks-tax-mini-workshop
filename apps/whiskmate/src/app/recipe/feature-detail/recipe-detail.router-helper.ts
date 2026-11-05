export const recipeDetailRouterHelper = {
  RECIPES_PATH: 'recipes' as const,
  COMPARE_PATH: 'compare' as const,

  detail(recipeId: string) {
    return ['/', this.RECIPES_PATH, recipeId];
  },

  cook(recipeId: string) {
    return ['/', this.RECIPES_PATH, recipeId, 'cook'];
  },

  scale(recipeId: string) {
    return ['/', this.RECIPES_PATH, recipeId, 'scale'];
  },

  /**
   * Recipe ids are passed as `left` and `right` query params.
   */
  compare() {
    return ['/', this.COMPARE_PATH];
  },
};
