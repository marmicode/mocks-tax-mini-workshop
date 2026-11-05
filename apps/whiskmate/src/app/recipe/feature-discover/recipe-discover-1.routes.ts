import type { Route } from '@angular/router';
import { CourseBrowser } from './course-browser.ng';
import { Discover } from './discover.ng';
import { Favorites } from './favorites.ng';
import { QuickRecipes } from './quick-recipes.ng';
import { RecipeOfTheDay } from './recipe-of-the-day.ng';
import { recipeDiscoverRouterHelper } from './recipe-discover.router-helper';
import { SurpriseMe } from './surprise-me.ng';

const { DISCOVER_PATH } = recipeDiscoverRouterHelper;

export const recipeDiscoverRoutes1: Route[] = [
  {
    path: DISCOVER_PATH,
    pathMatch: 'full',
    component: Discover,
  },
  {
    path: `${DISCOVER_PATH}/courses/:course`,
    component: CourseBrowser,
  },
  {
    path: `${DISCOVER_PATH}/quick`,
    component: QuickRecipes,
  },
  {
    path: `${DISCOVER_PATH}/today`,
    component: RecipeOfTheDay,
  },
  {
    path: `${DISCOVER_PATH}/favorites`,
    component: Favorites,
  },
  {
    path: `${DISCOVER_PATH}/surprise`,
    component: SurpriseMe,
  },
];
