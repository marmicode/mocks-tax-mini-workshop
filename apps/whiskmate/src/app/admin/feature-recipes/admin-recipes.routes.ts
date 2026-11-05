import type { Route } from '@angular/router';
import { AdminRecipeCreate } from './admin-recipe-create.ng';
import { AdminRecipeDelete } from './admin-recipe-delete.ng';
import { AdminRecipeEdit } from './admin-recipe-edit.ng';
import { AdminRecipeList } from './admin-recipe-list.ng';

/**
 * Children of the admin route.
 */
export const adminRecipesRoutes: Route[] = [
  {
    path: 'recipes',
    component: AdminRecipeList,
  },
  {
    path: 'recipes/new',
    component: AdminRecipeCreate,
  },
  {
    path: 'recipes/:recipeId/edit',
    component: AdminRecipeEdit,
  },
  {
    path: 'recipes/:recipeId/delete',
    component: AdminRecipeDelete,
  },
];
