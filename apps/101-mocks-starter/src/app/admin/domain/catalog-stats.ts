import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import {
  COURSES,
  type Course,
  type Recipe,
} from '@whiskmate/shared-recipe/model';

export interface CatalogStatsSummary {
  recipeCount: number;
  countByCourse: Record<Course, number>;
  averageIngredientCount: number;
  averageStepCount: number;
  missingDescriptionCount: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogStats {
  private _recipeRepository = inject(RecipeRepository);

  stats(): Observable<CatalogStatsSummary> {
    return this._recipeRepository
      .search({ keywords: '', maxIngredientCount: null, maxStepCount: null })
      .pipe(map(summarize));
  }
}

function summarize(recipes: Recipe[]): CatalogStatsSummary {
  const countByCourse = Object.fromEntries(
    COURSES.map((course) => [
      course,
      recipes.filter((recipe) => recipe.course === course).length,
    ]),
  ) as Record<Course, number>;

  return {
    recipeCount: recipes.length,
    countByCourse,
    averageIngredientCount: average(
      recipes.map((recipe) => recipe.ingredients.length),
    ),
    averageStepCount: average(recipes.map((recipe) => recipe.steps.length)),
    missingDescriptionCount: recipes.filter(
      (recipe) => !recipe.description?.trim(),
    ).length,
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
