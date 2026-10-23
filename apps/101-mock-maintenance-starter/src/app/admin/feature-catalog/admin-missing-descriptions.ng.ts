import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

@Component({
  selector: 'wm-admin-missing-descriptions',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Missing descriptions</h2>
    <p class="intro wm-muted">Recipes whose description is missing or blank.</p>
    @if (recipes.hasValue()) {
      <p class="summary" data-testid="missing-description-summary">
        {{ missing().length }} of {{ recipes.value().length }} recipes
      </p>
      @if (missing().length === 0) {
        <p class="wm-muted" data-testid="empty-state">
          Every recipe has a description.
        </p>
      } @else {
        <ul>
          @for (recipe of missing(); track recipe.id) {
            <li data-testid="missing-description-row">
              <a [routerLink]="editRoute(recipe.id)">{{ recipe.name }}</a>
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

    .summary {
      font: var(--mat-sys-title-small);
    }
  `,
})
export class AdminMissingDescriptions {
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  missing = computed(() =>
    this.recipes.hasValue()
      ? this.recipes
          .value()
          .filter((recipe) => !recipe.description?.trim())
          .sort((a, b) => a.name.localeCompare(b.name))
      : [],
  );

  editRoute(recipeId: string) {
    return adminRecipesRouterHelper.edit(recipeId);
  }
}
