import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

@Component({
  selector: 'wm-admin-ingredient-histogram',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Ingredient counts</h2>
    <p class="intro wm-muted">
      How many recipes have each number of ingredients.
    </p>
    @if (recipes.hasValue()) {
      @if (buckets().length === 0) {
        <p class="wm-muted" data-testid="empty-state">No recipes yet.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Ingredients</th>
              <th>Recipes</th>
            </tr>
          </thead>
          <tbody>
            @for (bucket of buckets(); track bucket.ingredientCount) {
              <tr data-testid="histogram-row">
                <td>{{ bucket.ingredientCount }}</td>
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
      background: var(--mat-sys-tertiary);
      border-radius: 4px;
      display: inline-block;
      height: 0.75rem;
      margin-right: 0.5rem;
      max-width: 200px;
    }
  `,
})
export class AdminIngredientHistogram {
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
      const ingredientCount = recipe.ingredients.length;
      counts.set(ingredientCount, (counts.get(ingredientCount) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([ingredientCount, recipeCount]) => ({
        ingredientCount,
        recipeCount,
      }))
      .sort((a, b) => a.ingredientCount - b.ingredientCount);
  });

  maxCount = computed(() =>
    Math.max(1, ...this.buckets().map((bucket) => bucket.recipeCount)),
  );
}
