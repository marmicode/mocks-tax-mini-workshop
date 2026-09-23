import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { WeekdayAssignments } from '@whiskmate/shared-meal-plan/domain';
import { WEEKDAYS } from '@whiskmate/shared/model';

const EMPTY_DAY = '—';

@Injectable({ providedIn: 'root' })
export class MealPlanExporter {
  private _recipeRepository = inject(RecipeRepository);

  /**
   * One line per weekday, e.g. "Monday: Shakshuka".
   * Empty days and recipes that no longer exist are rendered as "—".
   */
  toText(assignments: WeekdayAssignments): Observable<string> {
    return forkJoin(
      WEEKDAYS.map((weekday) => {
        const recipeId = assignments[weekday];
        const recipeName$ =
          recipeId == null
            ? of(EMPTY_DAY)
            : this._recipeRepository
                .findById({ id: recipeId })
                .pipe(map((recipe) => recipe?.name ?? EMPTY_DAY));

        return recipeName$.pipe(
          map((name) => `${capitalize(weekday)}: ${name}`),
        );
      }),
    ).pipe(map((lines) => lines.join('\n')));
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
