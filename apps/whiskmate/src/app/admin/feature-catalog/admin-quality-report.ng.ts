import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

const CHECK_COUNT = 4;

interface RecipeQuality {
  recipe: Recipe;
  issues: string[];
  score: number;
}

@Component({
  selector: 'wm-admin-quality-report',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Quality report</h2>
    <p class="intro wm-muted">
      Checks descriptions, steps, ingredient quantities and pictures.
    </p>
    <label class="filter">
      <input
        type="checkbox"
        [checked]="onlyWithIssues()"
        (change)="onlyWithIssues.set(!onlyWithIssues())"
      />
      Only recipes with issues
    </label>
    @if (recipes.hasValue()) {
      <table>
        <thead>
          <tr>
            <th>Recipe</th>
            <th>Score</th>
            <th>Issues</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.recipe.id) {
            <tr data-testid="quality-row">
              <td>
                <a class="name" [routerLink]="editRoute(row.recipe.id)">{{
                  row.recipe.name
                }}</a>
              </td>
              <td>
                <span
                  class="score"
                  data-testid="quality-score"
                  [class.perfect]="row.issues.length === 0"
                  [class.fair]="row.issues.length > 0 && row.score >= 50"
                  >{{ row.score }}%</span
                >
              </td>
              <td>
                @if (row.issues.length === 0) {
                  ✅
                } @else {
                  <ul class="issues">
                    @for (issue of row.issues; track issue) {
                      <li>{{ issue }}</li>
                    }
                  </ul>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .back {
      font: var(--mat-sys-label-large);
    }

    .intro {
      margin: -0.75rem 0 1.5rem;
    }

    .filter {
      align-items: center;
      display: inline-flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .filter input {
      accent-color: var(--mat-sys-primary);
      height: 18px;
      width: 18px;
    }

    td {
      vertical-align: top;
    }

    .name {
      font: var(--mat-sys-title-small);
    }

    .score {
      background: var(--mat-sys-error-container);
      border-radius: 999px;
      color: var(--mat-sys-on-error-container);
      display: inline-block;
      font: var(--mat-sys-label-large);
      min-width: 3rem;
      padding: 0.15rem 0.6rem;
      text-align: center;
    }

    .score.fair {
      background: #ffe0b2;
      color: #7a4100;
    }

    .score.perfect {
      background: #c8e6c9;
      color: #1b5e20;
    }

    .issues {
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
      padding-left: 1.1rem;
    }
  `,
})
export class AdminQualityReport {
  protected readonly adminRoute = ['/', 'admin'];

  onlyWithIssues = signal(false);

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  rows = computed(() => {
    if (!this.recipes.hasValue()) {
      return [];
    }
    const rows = this.recipes.value().map(assessQuality);
    return this.onlyWithIssues()
      ? rows.filter((row) => row.issues.length > 0)
      : rows;
  });

  editRoute(recipeId: string) {
    return adminRecipesRouterHelper.edit(recipeId);
  }
}

function assessQuality(recipe: Recipe): RecipeQuality {
  const issues: string[] = [];

  if (!recipe.description?.trim()) {
    issues.push('Missing description');
  }
  if (recipe.steps.length < 3) {
    issues.push('Fewer than 3 steps');
  }
  const unquantified = recipe.ingredients.filter(
    (ingredient) => ingredient.quantity == null,
  ).length;
  if (unquantified > recipe.ingredients.length / 2) {
    issues.push('Most ingredients have no quantity');
  }
  if (
    !recipe.pictureUri.startsWith('https://') &&
    !recipe.pictureUri.startsWith('/images/')
  ) {
    issues.push('Picture is not served over https');
  }

  return {
    recipe,
    issues,
    score: Math.round(((CHECK_COUNT - issues.length) / CHECK_COUNT) * 100),
  };
}
