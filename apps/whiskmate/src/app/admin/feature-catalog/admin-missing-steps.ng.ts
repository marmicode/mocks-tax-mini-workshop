import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

@Component({
  selector: 'wm-admin-missing-steps',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Recipes without steps</h2>
    <p class="intro wm-muted">Recipes with no steps, or only blank ones.</p>
    @if (recipes.hasValue()) {
      @if (rows().length === 0) {
        <p class="wm-muted" data-testid="empty-state">
          Every recipe has steps.
        </p>
      } @else {
        <ul>
          @for (row of rows(); track row.id) {
            <li data-testid="missing-steps-row">
              <a [routerLink]="editRoute(row.id)">{{ row.name }}</a>
              @if (row.blankStepCount > 0) {
                <span class="wm-muted"> ({{ row.blankStepCount }} blank)</span>
              }
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
export class AdminMissingSteps {
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  rows = computed(() => {
    if (!this.recipes.hasValue()) {
      return [];
    }
    return this.recipes
      .value()
      .filter((recipe) => recipe.steps.every((step) => !step.trim()))
      .map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        blankStepCount: recipe.steps.length,
      }));
  });

  editRoute(recipeId: string) {
    return adminRecipesRouterHelper.edit(recipeId);
  }
}
