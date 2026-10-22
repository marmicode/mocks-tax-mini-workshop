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

@Injectable({ providedIn: 'root' })
export class RecipeRepository {
  private _http = inject(HttpClient);

  search(params: RecipeSearchParams): Observable<Recipe[]> {
    return this._http.post<Recipe[]>('/api/recipes/search', params);
  }

  /**
   * Undefined when the id is not in the catalog.
   * Meal Plan renders that day as empty. The weekday slot stays.
   */
  findById({ id }: { id: string }): Observable<Recipe | undefined> {
    return this._http
      .get<Recipe>(`/api/recipes/${encodeURIComponent(id)}`)
      .pipe(
        catchError((error: unknown) =>
          error instanceof HttpErrorResponse && error.status === 404
            ? of(undefined)
            : throwError(() => error),
        ),
      );
  }

  create(recipe: Recipe): Observable<Recipe> {
    return this._http.post<Recipe>('/api/recipes', recipe);
  }

  update(recipe: Recipe): Observable<Recipe> {
    return this._http.put<Recipe>(
      `/api/recipes/${encodeURIComponent(recipe.id)}`,
      recipe,
    );
  }

  remove({ id }: { id: string }): Observable<void> {
    return this._http.delete<void>(`/api/recipes/${encodeURIComponent(id)}`);
  }
}
