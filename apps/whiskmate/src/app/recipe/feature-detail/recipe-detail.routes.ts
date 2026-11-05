import type { Route } from '@angular/router';
import { RecipeCompare } from './recipe-compare.ng';
import { RecipeCookingMode } from './recipe-cooking-mode.ng';
import { RecipeDetail } from './recipe-detail.ng';
import { recipeDetailRouterHelper } from './recipe-detail.router-helper';
import { recipeExistsGuard } from './recipe-exists.guard';
import { RecipeScaler } from './recipe-scaler.ng';
import { recipeTitleResolver } from './recipe-title.resolver';

const RECIPE_PATH = `${recipeDetailRouterHelper.RECIPES_PATH}/:recipeId`;

export const recipeDetailRoutes: Route[] = [
  {
    path: RECIPE_PATH,
    canActivate: [recipeExistsGuard],
    title: recipeTitleResolver,
    component: RecipeDetail,
  },
  {
    path: `${RECIPE_PATH}/cook`,
    canActivate: [recipeExistsGuard],
    title: recipeTitleResolver,
    component: RecipeCookingMode,
  },
  {
    path: `${RECIPE_PATH}/scale`,
    canActivate: [recipeExistsGuard],
    title: recipeTitleResolver,
    component: RecipeScaler,
  },
  {
    path: recipeDetailRouterHelper.COMPARE_PATH,
    title: 'Compare recipes · Whiskmate',
    component: RecipeCompare,
  },
];
