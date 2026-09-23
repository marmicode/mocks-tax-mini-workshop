import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { COURSES, type Recipe } from '@whiskmate/shared-recipe/model';

interface ImportSummary {
  created: number;
  updated: number;
}

@Component({
  imports: [RouterLink],
  selector: 'wm-admin-import',
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Import recipes</h2>
    <p class="intro wm-muted">
      Paste a JSON array of recipes or pick a file. Existing recipes (same id)
      are updated, others are created.
    </p>
    <section class="wm-surface form">
      <label class="file">
        <span>JSON file</span>
        <input
          type="file"
          accept="application/json"
          aria-label="Recipes file"
          (change)="onFile($any($event.target).files?.[0])"
        />
      </label>
      <textarea
        aria-label="Recipes JSON"
        rows="14"
        placeholder='[{ "id": "...", "name": "...", "course": "main", ... }]'
        [value]="source()"
        (input)="onSourceChange($any($event.target).value)"
      ></textarea>
      @if (parsed(); as result) {
        @if (result.error) {
          <p class="status error" data-testid="import-error">
            {{ result.error }}
          </p>
        } @else {
          <div class="ready">
            <p class="status" data-testid="import-ready">
              {{ result.recipes.length }} valid recipe(s) ready to import
            </p>
            <button
              type="button"
              class="wm-button-primary"
              [disabled]="importing()"
              (click)="onImport()"
            >
              Import
            </button>
          </div>
        }
      }
      @if (summary(); as summary) {
        <p class="status success" data-testid="import-summary">
          {{ summary.created }} created, {{ summary.updated }} updated
        </p>
      }
    </section>
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

    .form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
    }

    .file {
      align-items: center;
      display: flex;
      gap: 1rem;
      font: var(--mat-sys-title-small);
    }

    input[type='file']::file-selector-button {
      background: var(--mat-sys-secondary-container);
      border: none;
      border-radius: 999px;
      color: var(--mat-sys-on-secondary-container);
      cursor: pointer;
      font: var(--mat-sys-label-large);
      margin-right: 0.75rem;
      padding: 0.5rem 1rem;
    }

    textarea {
      font-family: ui-monospace, monospace;
      font-size: 0.85rem;
    }

    .ready {
      align-items: center;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
    }

    .status {
      border-radius: 8px;
      margin: 0;
      padding: 0.6rem 0.9rem;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .status.error {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }

    .status.success {
      background: #c8e6c9;
      color: #1b5e20;
    }
  `,
})
export class AdminImport {
  protected readonly adminRoute = ['/', 'admin'];

  source = signal('');
  importing = signal(false);
  summary = signal<ImportSummary | null>(null);

  parsed = computed(() => {
    const source = this.source().trim();
    return source === '' ? null : parseRecipes(source);
  });

  private _recipeRepository = inject(RecipeRepository);

  onSourceChange(source: string): void {
    this.source.set(source);
    this.summary.set(null);
  }

  async onFile(file: File | undefined): Promise<void> {
    if (file != null) {
      this.onSourceChange(await file.text());
    }
  }

  onImport(): void {
    const recipes = this.parsed()?.recipes ?? [];
    if (recipes.length === 0) {
      return;
    }

    this.importing.set(true);
    this._recipeRepository
      .search(createRecipeSearchParams())
      .pipe(
        switchMap((existingRecipes) => {
          const existingIds = new Set(existingRecipes.map(({ id }) => id));
          const writes: Observable<'created' | 'updated'>[] = recipes.map(
            (recipe) =>
              existingIds.has(recipe.id)
                ? this._recipeRepository
                    .update(recipe)
                    .pipe(map(() => 'updated' as const))
                : this._recipeRepository
                    .create(recipe)
                    .pipe(map(() => 'created' as const)),
          );
          return forkJoin(writes);
        }),
      )
      .subscribe((results) => {
        this.importing.set(false);
        this.summary.set({
          created: results.filter((result) => result === 'created').length,
          updated: results.filter((result) => result === 'updated').length,
        });
      });
  }
}

function parseRecipes(
  source: string,
): { recipes: Recipe[]; error?: undefined } | { recipes: []; error: string } {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    return { recipes: [], error: 'Invalid JSON.' };
  }

  if (!Array.isArray(value)) {
    return { recipes: [], error: 'Expected an array of recipes.' };
  }

  const invalidIndex = value.findIndex((item) => !isRecipe(item));
  if (invalidIndex !== -1) {
    return {
      recipes: [],
      error: `Recipe #${invalidIndex + 1} is invalid: id, name, course, ingredients and steps are required.`,
    };
  }

  return { recipes: value as Recipe[] };
}

function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== 'object' || value == null) {
    return false;
  }
  const recipe = value as Record<string, unknown>;
  return (
    typeof recipe['id'] === 'string' &&
    typeof recipe['name'] === 'string' &&
    COURSES.some((course) => course === recipe['course']) &&
    Array.isArray(recipe['ingredients']) &&
    Array.isArray(recipe['steps'])
  );
}
