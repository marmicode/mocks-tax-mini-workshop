import type { Route } from '@angular/router';
import { IngredientIndex } from './ingredient-index.ng';
import { MenuBuilder } from './menu-builder.ng';
import { Pantry } from './pantry.ng';
import { RecentlyViewedPage } from './recently-viewed.ng';

export const recipeDiscoverRoutes2: Route[] = [
  {
    path: 'discover/recently-viewed',
    component: RecentlyViewedPage,
    title: 'Recently viewed',
  },
  {
    path: 'discover/ingredients',
    component: IngredientIndex,
    title: 'Ingredient index',
  },
  {
    path: 'discover/pantry',
    component: Pantry,
    title: 'What can I cook?',
  },
  {
    path: 'discover/menu-builder',
    component: MenuBuilder,
    title: 'Menu builder',
  },
];
