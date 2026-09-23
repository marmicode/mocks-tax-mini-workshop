import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { COURSES, type Course } from '@whiskmate/shared-recipe/model';
import { RandomAdapter } from '@whiskmate/shared/infra';
import { courseLabel } from './course-label';

@Component({
  selector: 'wm-surprise-me',
  imports: [MatButtonToggle, MatButtonToggleGroup, RouterLink],
  template: `
    <h2>Surprise me</h2>
    <mat-button-toggle-group
      aria-label="Course"
      [value]="course()"
      (change)="course.set($event.value)"
    >
      <mat-button-toggle [value]="null">Any</mat-button-toggle>
      @for (option of courses; track option) {
        <mat-button-toggle [value]="option">{{
          courseLabel(option)
        }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
    @if (surprise.hasValue()) {
      @if (surprise.value(); as recipe) {
        <article class="hero">
          <img [src]="recipe.pictureUri" [alt]="recipe.name" />
          <div class="info">
            <p class="eyebrow">🎲 {{ recipe.course }}</p>
            <h3 data-testid="recipe-name">{{ recipe.name }}</h3>
            @if (recipe.description) {
              <p class="description">{{ recipe.description }}</p>
            }
            <div class="wm-toolbar">
              <a
                class="wm-button wm-button-primary"
                [routerLink]="detailRoute(recipe.id)"
                >See the recipe</a
              >
              <button type="button" (click)="surprise.reload()">
                Surprise me again
              </button>
            </div>
          </div>
        </article>
      } @else {
        <p class="empty" data-testid="no-recipes-message">
          Nothing to surprise you with.
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .hero {
      background: var(--mat-sys-surface);
      border-radius: 20px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 4px 16px rgb(0 0 0 / 8%);
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      overflow: hidden;
    }

    @media (max-width: 800px) {
      .hero {
        grid-template-columns: 1fr;
      }
    }

    .hero img {
      aspect-ratio: 4 / 3;
      display: block;
      height: 100%;
      object-fit: cover;
      width: 100%;
    }

    .info {
      align-items: flex-start;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      justify-content: center;
      padding: 2rem;
    }

    .eyebrow {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      letter-spacing: 0.08em;
      margin: 0;
      text-transform: uppercase;
    }

    h3 {
      font: var(--mat-sys-headline-medium);
      margin: 0;
    }

    .description {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
      margin: 0;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }

    mat-button-toggle-group {
      margin-bottom: 1.5rem;
    }
  `,
})
export class SurpriseMe {
  course = signal<Course | null>(null);

  protected readonly courses = COURSES;
  protected readonly courseLabel = courseLabel;

  private _recipeRepository = inject(RecipeRepository);
  private _random = inject(RandomAdapter);

  surprise = rxResource({
    params: () => ({ course: this.course() }),
    stream: ({ params: { course } }) =>
      this._recipeRepository
        .search(
          createRecipeSearchParams({ courses: course != null ? [course] : [] }),
        )
        .pipe(
          map((recipes) =>
            recipes.length > 0 ? this._random.pick(recipes) : null,
          ),
        ),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
