import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import { RandomAdapter } from '@whiskmate/shared/infra';
import { WEEKDAYS } from '@whiskmate/shared/model';
import type { MealPlanSuggestions } from './meal-plan-suggester';

const QUICK_MAX_STEP_COUNT = 4;

@Injectable({ providedIn: 'root' })
export class RandomWeekFiller {
  private _recipeRepository = inject(RecipeRepository);
  private _random = inject(RandomAdapter);

  /**
   * Picks a random main for each empty weekday, never the same one twice
   * and never one that is already planned.
   * Weekdays are left out once the candidates run out.
   */
  fill(
    assignments: WeekdayAssignments,
    { quickOnly = false }: { quickOnly?: boolean } = {},
  ): Observable<MealPlanSuggestions> {
    const plannedIds = new Set(Object.values(assignments));

    return this._recipeRepository
      .search(
        createRecipeSearchParams({
          maxStepCount: quickOnly ? QUICK_MAX_STEP_COUNT : null,
        }),
      )
      .pipe(
        map((recipes) => {
          let candidates = recipes.filter(
            (recipe) => recipe.course === 'main' && !plannedIds.has(recipe.id),
          );
          const suggestions: MealPlanSuggestions = {};

          for (const weekday of WEEKDAYS) {
            if (assignments[weekday] != null || candidates.length === 0) {
              continue;
            }
            const recipe = this._random.pick(candidates);
            suggestions[weekday] = recipe;
            candidates = candidates.filter(
              (candidate) => candidate.id !== recipe.id,
            );
          }

          return suggestions;
        }),
      );
  }
}
