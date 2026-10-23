export const recipeRouterHelper = {
  SEARCH_PATH: 'search' as const,

  search() {
    return ['/', this.SEARCH_PATH];
  },

  keywords() {
    return ['/', this.SEARCH_PATH, 'keywords'];
  },

  byIngredientCount() {
    return ['/', this.SEARCH_PATH, 'by-ingredient-count'];
  },
};
