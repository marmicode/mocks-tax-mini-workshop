import type { Route } from '@angular/router';
import { RecipeByIngredientCount } from './recipe-by-ingredient-count.ng';
import { RecipeKeywordChips } from './recipe-keyword-chips.ng';
import { recipeRouterHelper } from './recipe.router-helper';

export const recipeSearchRoutes: Route[] = [
  {
    path: `${recipeRouterHelper.SEARCH_PATH}/keywords`,
    component: RecipeKeywordChips,
  },
  {
    path: `${recipeRouterHelper.SEARCH_PATH}/by-ingredient-count`,
    component: RecipeByIngredientCount,
  },
];
