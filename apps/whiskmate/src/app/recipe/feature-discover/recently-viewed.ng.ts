import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';
import { RecentlyViewed } from '@whiskmate/recipe/domain';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

@Component({
  selector: 'wm-recently-viewed',
  imports: [RouterLink],
  template: `
    <h2>Recently viewed</h2>
    @if (recipes.hasValue()) {
      @if (recipes.value().length === 0) {
        <p class="empty" data-testid="empty-message">
          You haven't viewed any recipe yet.
        </p>
      } @else {
        <ul>
          @for (recipe of recipes.value(); track recipe.id) {
            <li data-testid="recently-viewed-recipe">
              <img [src]="recipe.pictureUri" [alt]="recipe.name" />
              <a [routerLink]="detailRoute(recipe.id)">{{ recipe.name }}</a>
              <span class="course wm-chip">{{ recipe.course }}</span>
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

    ul {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      align-items: center;
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 2px 8px rgb(0 0 0 / 6%);
      display: flex;
      gap: 1rem;
      padding: 0.75rem;
      position: relative;
    }

    img {
      border-radius: 12px;
      height: 64px;
      object-fit: cover;
      width: 96px;
    }

    a {
      color: var(--mat-sys-on-surface);
      flex: 1;
      font: var(--mat-sys-title-medium);

      /* Makes the whole row clickable. */
      &::after {
        content: '';
        inset: 0;
        position: absolute;
      }
    }

    .course {
      text-transform: capitalize;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class RecentlyViewedPage {
  private _recentlyViewed = inject(RecentlyViewed);
  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    params: () => this._recentlyViewed.ids(),
    stream: ({ params: ids }) =>
      ids.length === 0
        ? of([])
        : forkJoin(
            ids.map((id) => this._recipeRepository.findById({ id })),
          ).pipe(
            map((recipes) =>
              recipes.filter((recipe): recipe is Recipe => recipe != null),
            ),
          ),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
