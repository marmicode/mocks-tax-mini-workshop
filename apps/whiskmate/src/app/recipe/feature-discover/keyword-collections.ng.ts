import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { RecipePreview } from '@whiskmate/recipe/ui';
import { Catalog } from '@whiskmate/shared/ui';

const COLLECTIONS = [
  { keyword: 'soup', label: 'Soups' },
  { keyword: 'salad', label: 'Salads' },
  { keyword: 'cake', label: 'Cakes' },
] as const;

type CollectionKeyword = (typeof COLLECTIONS)[number]['keyword'];

@Component({
  selector: 'wm-keyword-collections',
  imports: [Catalog, MatButtonToggle, MatButtonToggleGroup, RecipePreview],
  template: `
    <h2>Collections</h2>
    <mat-button-toggle-group
      aria-label="Collection"
      [value]="keyword()"
      (change)="keyword.set($event.value)"
    >
      @for (collection of collections; track collection.keyword) {
        <mat-button-toggle [value]="collection.keyword">{{
          collection.label
        }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
    <wm-catalog>
      @if (recipes.hasValue()) {
        @for (recipe of recipes.value(); track recipe.id) {
          <wm-recipe-preview
            [recipe]="recipe"
            [link]="detailRoute(recipe.id)"
          />
        } @empty {
          <p class="empty" data-testid="no-recipes-message">
            Nothing in this collection yet.
          </p>
        }
      }
    </wm-catalog>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      grid-column: 1 / -1;
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class KeywordCollections {
  keyword = signal<CollectionKeyword>('soup');

  protected readonly collections = COLLECTIONS;

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    params: () => this.keyword(),
    stream: ({ params: keywords }) =>
      this._recipeRepository.search(createRecipeSearchParams({ keywords })),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
