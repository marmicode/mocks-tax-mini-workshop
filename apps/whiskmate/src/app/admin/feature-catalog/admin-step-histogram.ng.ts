import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

@Component({
  selector: 'wm-admin-step-histogram',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Step counts</h2>
    <p class="intro wm-muted">How many recipes have each number of steps.</p>
    @if (recipes.hasValue()) {
      @if (buckets().length === 0) {
        <p class="wm-muted" data-testid="empty-state">No recipes yet.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Steps</th>
              <th>Recipes</th>
            </tr>
          </thead>
          <tbody>
            @for (bucket of buckets(); track bucket.stepCount) {
              <tr data-testid="histogram-row">
                <td>{{ bucket.stepCount }}</td>
                <td>
                  <span
                    class="bar"
                    [style.width.%]="(bucket.recipeCount / maxCount()) * 100"
                  ></span>
                  {{ bucket.recipeCount }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
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

    .bar {
      background: var(--mat-sys-primary);
      border-radius: 4px;
      display: inline-block;
      height: 0.75rem;
      margin-right: 0.5rem;
      max-width: 200px;
    }
  `,
})
export class AdminStepHistogram {
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  buckets = computed(() => {
    if (!this.recipes.hasValue()) {
      return [];
    }
    const counts = new Map<number, number>();
    for (const recipe of this.recipes.value()) {
      const stepCount = recipe.steps.length;
      counts.set(stepCount, (counts.get(stepCount) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([stepCount, recipeCount]) => ({ stepCount, recipeCount }))
      .sort((a, b) => a.stepCount - b.stepCount);
  });

  maxCount = computed(() =>
    Math.max(1, ...this.buckets().map((bucket) => bucket.recipeCount)),
  );
}
