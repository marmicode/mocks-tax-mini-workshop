import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import type { Course, Recipe } from '@whiskmate/shared-recipe/model';

/**
 * Body sent to the backend's recipe search endpoint.
 */
export interface RecipeSearchParams {
  keywords: string;
  maxIngredientCount: number | null;
  maxStepCount: number | null;
  courses?: Course[];
}

export function createRecipeSearchParams(
  params: Partial<RecipeSearchParams> = {},
): RecipeSearchParams {
  return {
    keywords: '',
    maxIngredientCount: null,
    maxStepCount: null,
    ...params,
  };
}

export interface RecipeRepositoryDef {
  search(params: RecipeSearchParams): Observable<Recipe[]>;

  /**
   * Undefined when the id is not in the catalog.
   */
  findById(params: { id: string }): Observable<Recipe | undefined>;

  create(recipe: Recipe): Observable<Recipe>;

  update(recipe: Recipe): Observable<Recipe>;

  remove(params: { id: string }): Observable<void>;
}

const RECIPES_URL = 'http://localhost:3333/api/recipes';

@Injectable({ providedIn: 'root' })
export class RecipeRepository implements RecipeRepositoryDef {
  private _http = inject(HttpClient);

  search(params: RecipeSearchParams): Observable<Recipe[]> {
    return this._http.post<Recipe[]>(`${RECIPES_URL}/search`, params);
  }

  /**
   * Undefined when the id is not in the catalog.
   * Meal Plan renders that day as empty. The weekday slot stays.
   */
  findById({ id }: { id: string }): Observable<Recipe | undefined> {
    return this._http
      .get<Recipe>(`${RECIPES_URL}/${encodeURIComponent(id)}`)
      .pipe(
        catchError((error: unknown) =>
          error instanceof HttpErrorResponse && error.status === 404
            ? of(undefined)
            : throwError(() => error),
        ),
      );
  }

  create(recipe: Recipe): Observable<Recipe> {
    return this._http.post<Recipe>(RECIPES_URL, recipe);
  }

  update(recipe: Recipe): Observable<Recipe> {
    return this._http.put<Recipe>(
      `${RECIPES_URL}/${encodeURIComponent(recipe.id)}`,
      recipe,
    );
  }

  remove({ id }: { id: string }): Observable<void> {
    return this._http.delete<void>(`${RECIPES_URL}/${encodeURIComponent(id)}`);
  }
}
