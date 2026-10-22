import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Course, Recipe } from '@whiskmate/shared-recipe/model';
import { RandomAdapter } from '@whiskmate/shared/infra';

/**
 * A course is null when the catalog has no recipe for it.
 */
export type Menu = Record<Course, Recipe | null>;

@Injectable({ providedIn: 'root' })
export class MenuGenerator {
  private _recipeRepository = inject(RecipeRepository);
  private _random = inject(RandomAdapter);

  generate(): Observable<Menu> {
    return forkJoin({
      starter: this.regenerate('starter', null),
      main: this.regenerate('main', null),
      dessert: this.regenerate('dessert', null),
    });
  }

  /**
   * Picks another recipe than `current` for the course, unless it is the only one.
   */
  regenerate(
    course: Course,
    current: Recipe | null,
  ): Observable<Recipe | null> {
    return this._recipeRepository
      .search({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: [course],
      })
      .pipe(
        map((recipes) => {
          const candidates = recipes.filter(
            (recipe) => recipe.id !== current?.id,
          );
          if (candidates.length === 0) {
            return recipes[0] ?? null;
          }
          return this._random.pick(candidates);
        }),
      );
  }
}
