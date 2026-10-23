import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

@Component({
  selector: 'wm-admin-picture-audit',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Picture audit</h2>
    <p class="intro wm-muted">
      Pictures should be served over https or from our own images.
    </p>
    @if (recipes.hasValue()) {
      @if (rows().length === 0) {
        <p class="wm-muted" data-testid="empty-state">All pictures are safe.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Recipe</th>
              <th>Picture</th>
              <th>Issue</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr data-testid="picture-audit-row">
                <td>
                  <a [routerLink]="editRoute(row.id)">{{ row.name }}</a>
                </td>
                <td>
                  <code>{{ row.pictureUri }}</code>
                </td>
                <td>{{ row.issue }}</td>
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

    code {
      word-break: break-all;
    }
  `,
})
export class AdminPictureAudit {
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  rows = computed(() =>
    this.recipes.hasValue() ? this.recipes.value().flatMap(auditPicture) : [],
  );

  editRoute(recipeId: string) {
    return adminRecipesRouterHelper.edit(recipeId);
  }
}

function auditPicture(recipe: Recipe) {
  const { id, name, pictureUri } = recipe;
  if (!pictureUri.trim()) {
    return [{ id, name, pictureUri, issue: 'Missing picture' }];
  }
  if (pictureUri.startsWith('https://') || pictureUri.startsWith('/images/')) {
    return [];
  }
  if (pictureUri.startsWith('http://')) {
    return [{ id, name, pictureUri, issue: 'Not served over https' }];
  }
  return [{ id, name, pictureUri, issue: 'Unknown location' }];
}
