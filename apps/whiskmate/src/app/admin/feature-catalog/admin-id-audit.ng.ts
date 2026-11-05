import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

@Component({
  selector: 'wm-admin-id-audit',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Recipe id audit</h2>
    <p class="intro wm-muted">
      Ids should be kebab-case and match the recipe name.
    </p>
    @if (recipes.hasValue()) {
      @if (rows().length === 0) {
        <p class="wm-muted" data-testid="empty-state">All ids look good.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Issue</th>
              <th>Suggested id</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr data-testid="id-audit-row">
                <td>
                  <a [routerLink]="editRoute(row.id)">{{ row.id }}</a>
                </td>
                <td>{{ row.issue }}</td>
                <td>
                  <code>{{ row.suggestedId }}</code>
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
  `,
})
export class AdminIdAudit {
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  rows = computed(() =>
    this.recipes.hasValue() ? this.recipes.value().flatMap(auditId) : [],
  );

  editRoute(recipeId: string) {
    return adminRecipesRouterHelper.edit(recipeId);
  }
}

function auditId(recipe: Recipe) {
  const suggestedId = toKebabCase(recipe.name);
  if (!KEBAB_CASE.test(recipe.id)) {
    return [{ id: recipe.id, issue: 'Not kebab-case', suggestedId }];
  }
  if (recipe.id !== suggestedId) {
    return [{ id: recipe.id, issue: 'Does not match name', suggestedId }];
  }
  return [];
}

function toKebabCase(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
