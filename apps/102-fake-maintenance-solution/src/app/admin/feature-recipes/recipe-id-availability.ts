import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { RecipeRepository } from '@whiskmate/recipe/infra';

@Injectable({ providedIn: 'root' })
export class RecipeIdAvailability {
  private _recipeRepository = inject(RecipeRepository);

  /**
   * An empty id is considered available: the form requires it anyway.
   */
  isAvailable(id: string): Observable<boolean> {
    const trimmedId = id.trim();
    if (trimmedId === '') {
      return of(true);
    }

    return this._recipeRepository
      .findById({ id: trimmedId })
      .pipe(map((recipe) => recipe == null));
  }
}
