import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { WEEKDAYS, type Weekday } from '@whiskmate/shared/model';

export type MealPlanSuggestions = Partial<Record<Weekday, Recipe>>;

@Injectable({ providedIn: 'root' })
export class MealPlanSuggester {
  private _recipeRepository = inject(RecipeRepository);

  /**
   * Fills empty weekdays with mains that are not planned yet, round-robin.
   * Planned weekdays are left out of the suggestions.
   */
  suggest(assignments: WeekdayAssignments): Observable<MealPlanSuggestions> {
    const plannedIds = new Set(Object.values(assignments));

    return this._recipeRepository
      .search(createRecipeSearchParams({ courses: ['main'] }))
      .pipe(
        map((recipes) => {
          const candidates = recipes.filter(
            (recipe) => !plannedIds.has(recipe.id),
          );
          const emptyWeekdays = WEEKDAYS.filter(
            (weekday) => assignments[weekday] == null,
          );

          if (candidates.length === 0) {
            return {};
          }

          return Object.fromEntries(
            emptyWeekdays.map((weekday, index) => [
              weekday,
              candidates[index % candidates.length],
            ]),
          ) as MealPlanSuggestions;
        }),
      );
  }
}
