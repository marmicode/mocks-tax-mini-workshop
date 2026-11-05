import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import { KeywordSuggester } from '@whiskmate/recipe/domain';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { RecipePreview } from '@whiskmate/recipe/ui';
import { Catalog } from '@whiskmate/shared/ui';

@Component({
  selector: 'wm-recipe-keyword-chips',
  imports: [Catalog, RecipePreview],
  template: `
    <h2>Search by keyword</h2>
    <input
      type="search"
      placeholder="Start typing a keyword…"
      aria-label="Keyword prefix"
      [value]="prefix()"
      (input)="onPrefixChange($event)"
    />
    @if (keywords.hasValue() && keywords.value().length > 0) {
      <div class="chips">
        @for (keyword of keywords.value(); track keyword) {
          <button
            type="button"
            class="wm-chip"
            data-testid="keyword-chip"
            [attr.aria-pressed]="keyword === selectedKeyword()"
            (click)="selectedKeyword.set(keyword)"
          >
            {{ keyword }}
          </button>
        }
      </div>
    }
    @if (recipes.hasValue()) {
      <wm-catalog>
        @for (recipe of recipes.value(); track recipe.id) {
          <wm-recipe-preview
            [recipe]="recipe"
            [link]="detailRoute(recipe.id)"
          />
        } @empty {
          <p class="wm-muted" data-testid="no-recipes-message">
            No recipes found for "{{ selectedKeyword() }}".
          </p>
        }
      </wm-catalog>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    input {
      font: inherit;
      max-width: 320px;
      padding: 0.5rem 0.75rem;
      width: 100%;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    button[aria-pressed='true'] {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
  `,
})
export class RecipeKeywordChips {
  prefix = signal('');
  selectedKeyword = signal<string | null>(null);

  private _keywordSuggester = inject(KeywordSuggester);
  private _recipeRepository = inject(RecipeRepository);

  keywords = rxResource({
    params: () => this.prefix(),
    stream: ({ params: prefix }) => this._keywordSuggester.suggest(prefix),
  });

  recipes = rxResource({
    params: () => this.selectedKeyword() ?? undefined,
    stream: ({ params: keywords }) =>
      keywords
        ? this._recipeRepository.search(createRecipeSearchParams({ keywords }))
        : of([]),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }

  onPrefixChange(event: Event): void {
    this.prefix.set((event.target as HTMLInputElement).value);
    this.selectedKeyword.set(null);
  }
}
