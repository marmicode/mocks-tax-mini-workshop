import { Route } from '@angular/router';
import {
  Admin,
  adminGuard,
  adminRouterHelper,
} from '@whiskmate/admin/feature-admin';
import { adminCatalogRoutes } from '@whiskmate/admin/feature-catalog';
import { adminRecipesRoutes } from '@whiskmate/admin/feature-recipes';
import { mealPlanRoutes } from '@whiskmate/meal-plan/feature-meal-plan';
import { shoppingListRoutes } from '@whiskmate/meal-plan/feature-shopping-list';
import { recipeDetailRoutes } from '@whiskmate/recipe/feature-detail';
import { recipeDiscoverRoutes } from '@whiskmate/recipe/feature-discover';
import {
  RecipeSearch,
  recipeRouterHelper,
  recipeSearchRoutes,
} from '@whiskmate/recipe/feature-search';

export const appRoutes: Route[] = [
  {
    path: recipeRouterHelper.SEARCH_PATH,
    component: RecipeSearch,
  },
  ...recipeSearchRoutes,
  ...recipeDetailRoutes,
  ...recipeDiscoverRoutes,
  ...mealPlanRoutes,
  ...shoppingListRoutes,
  {
    path: adminRouterHelper.PATH,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: Admin,
      },
      ...adminRecipesRoutes,
      ...adminCatalogRoutes,
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: recipeRouterHelper.SEARCH_PATH,
  },
];
