import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Course, Recipe } from '@whiskmate/shared-recipe/model';

/**
 * Read-only views over the whole recipe catalog.
 */
@Injectable({ providedIn: 'root' })
export class RecipeCatalog {
  private _recipeRepository = inject(RecipeRepository);

  countAll(): Observable<number> {
    return this._listAll().pipe(map((recipes) => recipes.length));
  }

  /**
   * Alphabetical, without duplicates.
   */
  listNames(): Observable<string[]> {
    return this._listAll().pipe(
      map((recipes) =>
        [...new Set(recipes.map((recipe) => recipe.name))].sort((a, b) =>
          a.localeCompare(b),
        ),
      ),
    );
  }

  listByCourse(course: Course): Observable<Recipe[]> {
    return this._listAll().pipe(
      map((recipes) => recipes.filter((recipe) => recipe.course === course)),
    );
  }

  private _listAll(): Observable<Recipe[]> {
    return this._recipeRepository.search(createRecipeSearchParams());
  }
}
