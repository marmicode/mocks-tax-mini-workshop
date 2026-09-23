/**
 * Paths are relative to the admin route.
 */
export const adminRecipesRouterHelper = {
  RECIPES_PATH: 'recipes' as const,

  list() {
    return ['/', 'admin', this.RECIPES_PATH];
  },

  create() {
    return ['/', 'admin', this.RECIPES_PATH, 'new'];
  },

  edit(recipeId: string) {
    return ['/', 'admin', this.RECIPES_PATH, recipeId, 'edit'];
  },

  remove(recipeId: string) {
    return ['/', 'admin', this.RECIPES_PATH, recipeId, 'delete'];
  },
};
