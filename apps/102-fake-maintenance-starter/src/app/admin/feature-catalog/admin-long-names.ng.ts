import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

@Component({
  selector: 'wm-admin-long-names',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Long names</h2>
    <p class="intro wm-muted">Names that will not fit on a recipe card.</p>
    <label class="limit">
      Max length
      <input
        type="number"
        min="1"
        [value]="maxLength()"
        (input)="maxLength.set(+$any($event.target).value)"
      />
    </label>
    @if (recipes.hasValue()) {
      @if (rows().length === 0) {
        <p class="wm-muted" data-testid="empty-state">
          Every name fits within {{ maxLength() }} characters.
        </p>
      } @else {
        <ul>
          @for (row of rows(); track row.id) {
            <li data-testid="long-name-row">
              <a [routerLink]="editRoute(row.id)">{{ row.name }}</a>
              <span class="wm-muted"> ({{ row.length }})</span>
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

    .limit {
      align-items: center;
      display: inline-flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .limit input {
      width: 5rem;
    }
  `,
})
export class AdminLongNames {
  protected readonly adminRoute = ['/', 'admin'];

  maxLength = signal(30);

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
      .map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        length: recipe.name.length,
      }))
      .filter((row) => row.length > this.maxLength())
      .sort((a, b) => b.length - a.length);
  });

  editRoute(recipeId: string) {
    return adminRecipesRouterHelper.edit(recipeId);
  }
}
