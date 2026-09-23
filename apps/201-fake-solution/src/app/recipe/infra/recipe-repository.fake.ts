import {
  type EnvironmentProviders,
  Injectable,
  makeEnvironmentProviders,
} from '@angular/core';
import { defer, type Observable, of } from 'rxjs';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import {
  RecipeRepository,
  type RecipeRepositoryDef,
  type RecipeSearchParams,
} from './recipe-repository';

/**
 * In-memory stand-in for {@link RecipeRepository}.
 * It behaves like the recipe API, as verified by the repository contract.
 */
@Injectable()
export class RecipeRepositoryFake implements RecipeRepositoryDef {
  private _recipes: Recipe[] = [];

  search({
    keywords,
    maxIngredientCount,
    maxStepCount,
    courses,
  }: RecipeSearchParams): Observable<Recipe[]> {
    return defer(() => {
      const lowerCaseKeywords = keywords.toLowerCase();
      return of(
        this._recipes.filter(
          (recipe) =>
            (!lowerCaseKeywords ||
              recipe.name.toLowerCase().includes(lowerCaseKeywords)) &&
            (maxIngredientCount == null ||
              recipe.ingredients.length <= maxIngredientCount) &&
            (maxStepCount == null || recipe.steps.length <= maxStepCount) &&
            (courses == null || courses.includes(recipe.course)),
        ),
      );
    });
  }

  /**
   * Replaces the whole catalog.
   */
  setRecipes(recipes: Recipe[]): void {
    this._recipes = recipes;
  }
}

export function provideRecipeRepositoryFake(): EnvironmentProviders {
  return makeEnvironmentProviders([
    RecipeRepositoryFake,
    {
      provide: RecipeRepository,
      useExisting: RecipeRepositoryFake,
    },
  ]);
}
