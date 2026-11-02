import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { Observable } from 'rxjs';
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
}

const RECIPES_URL = 'http://localhost:3333/api/recipes';

@Service()
export class RecipeRepository implements RecipeRepositoryDef {
  private _http = inject(HttpClient);

  search(params: RecipeSearchParams): Observable<Recipe[]> {
    return this._http.post<Recipe[]>(`${RECIPES_URL}/search`, params);
  }
}
