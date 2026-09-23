import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

const MIN_PREFIX_LENGTH = 2;
const MAX_KEYWORDS = 5;

@Injectable({ providedIn: 'root' })
export class KeywordSuggester {
  private _recipeRepository = inject(RecipeRepository);

  /**
   * Words of matching recipe names that start with `prefix`, lowercased,
   * alphabetical and without duplicates.
   * Does not search when the prefix is too short.
   */
  suggest(prefix: string): Observable<string[]> {
    const keywords = prefix.trim().toLowerCase();
    if (keywords.length < MIN_PREFIX_LENGTH) {
      return of([]);
    }

    return this._recipeRepository
      .search(createRecipeSearchParams({ keywords }))
      .pipe(
        map((recipes) => {
          const words = recipes.flatMap((recipe) =>
            recipe.name.toLowerCase().split(/[^\p{L}]+/u),
          );
          return [...new Set(words)]
            .filter((word) => word.startsWith(keywords))
            .sort((a, b) => a.localeCompare(b))
            .slice(0, MAX_KEYWORDS);
        }),
      );
  }
}
