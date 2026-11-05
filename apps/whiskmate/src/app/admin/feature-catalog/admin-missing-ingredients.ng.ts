import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

@Component({
  selector: 'wm-admin-missing-ingredients',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Recipes without ingredients</h2>
    <p class="intro wm-muted">
      Recipes with no ingredients, or ingredients without a name.
    </p>
    @if (recipes.hasValue()) {
      @if (rows().length === 0) {
        <p class="wm-muted" data-testid="empty-state">
          Every recipe has ingredients.
        </p>
      } @else {
        <ul>
          @for (row of rows(); track row.id) {
            <li data-testid="missing-ingredients-row">
              <a [routerLink]="editRoute(row.id)">{{ row.name }}</a>
              <span class="wm-muted"> — {{ row.reason }}</span>
            </li>
          }
        </ul>
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
  `,
})
export class AdminMissingIngredients {
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  rows = computed(() => {
    if (!this.recipes.hasValue()) {
      return [];
    }
    return this.recipes.value().flatMap((recipe) => {
      if (recipe.ingredients.length === 0) {
        return [{ id: recipe.id, name: recipe.name, reason: 'no ingredients' }];
      }
      const unnamed = recipe.ingredients.filter(
        (ingredient) => !ingredient.name.trim(),
      ).length;
      return unnamed > 0
        ? [
            {
              id: recipe.id,
              name: recipe.name,
              reason: `${unnamed} unnamed ingredient(s)`,
            },
          ]
        : [];
    });
  });

  editRoute(recipeId: string) {
    return adminRecipesRouterHelper.edit(recipeId);
  }
}
