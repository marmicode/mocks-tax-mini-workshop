import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { normalizeIngredientName } from './ingredient-name';

interface IndexEntry {
  ingredient: string;
  recipes: Recipe[];
}

interface IndexSection {
  letter: string;
  entries: IndexEntry[];
}

@Component({
  selector: 'wm-ingredient-index',
  imports: [MatFormField, MatInput, MatLabel, RouterLink],
  template: `
    <h2>Ingredient index</h2>
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Filter ingredients</mat-label>
      <input
        matInput
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
    </mat-form-field>
    @for (section of sections(); track section.letter) {
      <section class="wm-surface" data-testid="index-section">
        <h3>{{ section.letter }}</h3>
        <dl>
          @for (entry of section.entries; track entry.ingredient) {
            <div data-testid="index-entry">
              <dt>{{ entry.ingredient }}</dt>
              <dd>
                @for (recipe of entry.recipes; track recipe.id) {
                  <a [routerLink]="detailRoute(recipe.id)">{{ recipe.name }}</a>
                }
              </dd>
            </div>
          }
        </dl>
      </section>
    } @empty {
      @if (recipes.hasValue()) {
        <p class="empty" data-testid="no-ingredients-message">
          No ingredients found.
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    mat-form-field {
      margin-bottom: 1.5rem;
      max-width: 400px;
      width: 100%;
    }

    section {
      margin-bottom: 1.25rem;
    }

    h3 {
      align-items: center;
      background: var(--mat-sys-primary);
      border-radius: 50%;
      color: var(--mat-sys-on-primary);
      display: flex;
      font: var(--mat-sys-title-large);
      height: 40px;
      justify-content: center;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      width: 40px;
    }

    dl {
      display: grid;
      gap: 0.25rem 2rem;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      margin: 0;
    }

    div {
      padding: 0.5rem 0;
    }

    dt {
      font: var(--mat-sys-title-small);
      margin-bottom: 0.4rem;
      text-transform: capitalize;
    }

    dd {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 0;
    }

    dd a {
      background: var(--mat-sys-secondary-container);
      border-radius: 999px;
      color: var(--mat-sys-on-secondary-container);
      font: var(--mat-sys-label-medium);
      padding: 0.2rem 0.7rem;
      text-decoration: none;

      &:hover {
        background: var(--mat-sys-primary-container);
      }
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class IngredientIndex {
  query = signal('');

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () =>
      this._recipeRepository.search({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
      }),
  });

  sections = computed<IndexSection[]>(() => {
    const recipes = this.recipes.hasValue() ? this.recipes.value() : [];
    const query = this.query().trim().toLowerCase();

    const recipesByIngredient = new Map<string, Recipe[]>();
    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        const name = normalizeIngredientName(ingredient.name);
        const ingredientRecipes = recipesByIngredient.get(name) ?? [];
        if (!ingredientRecipes.includes(recipe)) {
          recipesByIngredient.set(name, [...ingredientRecipes, recipe]);
        }
      }
    }

    const entries = [...recipesByIngredient]
      .map(([ingredient, recipes]) => ({ ingredient, recipes }))
      .filter(({ ingredient }) => ingredient.includes(query))
      .sort((a, b) => a.ingredient.localeCompare(b.ingredient));

    const sections = new Map<string, IndexEntry[]>();
    for (const entry of entries) {
      const letter = entry.ingredient.charAt(0);
      sections.set(letter, [...(sections.get(letter) ?? []), entry]);
    }

    return [...sections].map(([letter, entries]) => ({ letter, entries }));
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
