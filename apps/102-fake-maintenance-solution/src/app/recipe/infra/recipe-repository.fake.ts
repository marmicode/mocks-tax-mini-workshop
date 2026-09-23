import {
  type EnvironmentProviders,
  Injectable,
  makeEnvironmentProviders,
} from '@angular/core';
import { defer, type Observable, of, throwError } from 'rxjs';
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

  findById({ id }: { id: string }): Observable<Recipe | undefined> {
    return defer(() => of(this._recipes.find((recipe) => recipe.id === id)));
  }

  create(recipe: Recipe): Observable<Recipe> {
    return defer(() => {
      if (this._has(recipe.id)) {
        return throwError(
          () => new Error(`Recipe ${recipe.id} already exists`),
        );
      }
      this._recipes = [...this._recipes, recipe];
      return of(recipe);
    });
  }

  update(recipe: Recipe): Observable<Recipe> {
    return defer(() => {
      if (!this._has(recipe.id)) {
        return throwError(() => new Error(`Recipe ${recipe.id} not found`));
      }
      this._recipes = this._recipes.map((item) =>
        item.id === recipe.id ? recipe : item,
      );
      return of(recipe);
    });
  }

  remove({ id }: { id: string }): Observable<void> {
    return defer(() => {
      if (!this._has(id)) {
        return throwError(() => new Error(`Recipe ${id} not found`));
      }
      this._recipes = this._recipes.filter((recipe) => recipe.id !== id);
      return of(undefined);
    });
  }

  /**
   * Replaces the whole catalog.
   */
  setRecipes(recipes: Recipe[]): void {
    this._recipes = recipes;
  }

  getRecipesSync(): Recipe[] {
    return this._recipes;
  }

  private _has(id: string): boolean {
    return this._recipes.some((recipe) => recipe.id === id);
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
