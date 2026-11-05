import type { Route } from '@angular/router';
import { AlphabeticalIndex } from './alphabetical-index.ng';
import { CatalogSize } from './catalog-size.ng';
import { FiveIngredientRecipes } from './five-ingredient-recipes.ng';
import { IngredientSpotlight } from './ingredient-spotlight.ng';
import { KeywordCollections } from './keyword-collections.ng';
import { PictureGallery } from './picture-gallery.ng';
import { recipeDiscoverRouterHelper } from './recipe-discover.router-helper';
import { SimplestRecipes } from './simplest-recipes.ng';
import { ThreeStepRecipes } from './three-step-recipes.ng';
import { WeekendProjects } from './weekend-projects.ng';

const { DISCOVER_PATH } = recipeDiscoverRouterHelper;

export const recipeDiscoverRoutes3: Route[] = [
  {
    path: `${DISCOVER_PATH}/a-z`,
    component: AlphabeticalIndex,
    title: 'A–Z',
  },
  {
    path: `${DISCOVER_PATH}/five-ingredients`,
    component: FiveIngredientRecipes,
    title: 'Five ingredients or fewer',
  },
  {
    path: `${DISCOVER_PATH}/three-steps`,
    component: ThreeStepRecipes,
    title: 'Three steps or fewer',
  },
  {
    path: `${DISCOVER_PATH}/weekend-projects`,
    component: WeekendProjects,
    title: 'Weekend projects',
  },
  {
    path: `${DISCOVER_PATH}/simplest`,
    component: SimplestRecipes,
    title: 'Simplest recipes',
  },
  {
    path: `${DISCOVER_PATH}/ingredient-spotlight`,
    component: IngredientSpotlight,
    title: 'Ingredient spotlight',
  },
  {
    path: `${DISCOVER_PATH}/collections`,
    component: KeywordCollections,
    title: 'Collections',
  },
  {
    path: `${DISCOVER_PATH}/catalog`,
    component: CatalogSize,
    title: 'Our catalog',
  },
  {
    path: `${DISCOVER_PATH}/gallery`,
    component: PictureGallery,
    title: 'Gallery',
  },
];
