import type { Route } from '@angular/router';
import { recipeDiscoverRoutes1 } from './recipe-discover-1.routes';
import { recipeDiscoverRoutes2 } from './recipe-discover-2.routes';

export const recipeDiscoverRoutes: Route[] = [
  ...recipeDiscoverRoutes1,
  ...recipeDiscoverRoutes2,
];
