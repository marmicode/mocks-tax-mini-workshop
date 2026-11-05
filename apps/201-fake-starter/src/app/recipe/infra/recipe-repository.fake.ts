import { Service } from '@angular/core';
import { defer, type Observable, of } from 'rxjs';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import {
  type RecipeRepositoryDef,
  type RecipeSearchParams,
} from './recipe-repository';

/**
 * In-memory stand-in for the recipe repository.
 * It behaves like the recipe API, as verified by the repository contract.
 */
@Service({ autoProvided: false })
export class RecipeRepositoryFake {
  private _recipes: Recipe[] = [];
}
