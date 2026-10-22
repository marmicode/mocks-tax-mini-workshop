import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import {
  type Course,
  COURSES,
  type Recipe,
} from '@whiskmate/shared-recipe/model';

@Component({
  imports: [RouterLink],
  selector: 'wm-admin-course-board',
  template: `
    <a class="back" [routerLink]="adminRoute">← Admin</a>
    <h2>Course board</h2>
    <p class="intro wm-muted">Move recipes from one course to another.</p>
    <div class="board">
      @for (column of columns; track column.course) {
        <section class="column" [attr.data-testid]="'column-' + column.course">
          <h3>
            {{ column.course }}
            @if (column.recipes.hasValue()) {
              <span class="wm-chip">{{ column.recipes.value().length }}</span>
            }
          </h3>
          @if (column.recipes.hasValue()) {
            @for (recipe of column.recipes.value(); track recipe.id) {
              <div class="card wm-surface" data-testid="board-card">
                <span class="name" data-testid="board-recipe-name">{{
                  recipe.name
                }}</span>
                <select
                  [attr.aria-label]="'Move ' + recipe.name + ' to'"
                  (change)="onMove(recipe, $any($event.target).value)"
                >
                  <option value="" selected>Move to…</option>
                  @for (course of otherCourses(recipe.course); track course) {
                    <option [value]="course">{{ course }}</option>
                  }
                </select>
              </div>
            } @empty {
              <p class="wm-muted">No recipes</p>
            }
          }
        </section>
      }
    </div>
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

    .board {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 800px) {
      .board {
        grid-template-columns: 1fr;
      }
    }

    .column {
      background: var(--mat-sys-surface-container);
      border-radius: var(--wm-radius);
      padding: 0.75rem 1rem 1rem;
    }

    h3 {
      align-items: center;
      display: flex;
      justify-content: space-between;
      margin: 0.25rem 0 0.75rem;
      text-transform: capitalize;
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
      padding: 0.85rem 1rem;
    }

    .name {
      font: var(--mat-sys-title-small);
    }

    select {
      min-height: 34px;
      padding: 0.2rem 0.6rem;
    }
  `,
})
export class AdminCourseBoard {
  protected readonly adminRoute = ['/', 'admin'];

  private _recipeRepository = inject(RecipeRepository);

  columns = COURSES.map((course) => ({
    course,
    recipes: rxResource({
      stream: () =>
        this._recipeRepository.search({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: null,
          courses: [course],
        }),
    }),
  }));

  otherCourses(course: Course): Course[] {
    return COURSES.filter((item) => item !== course);
  }

  onMove(recipe: Recipe, course: string): void {
    const target = COURSES.find((item) => item === course);
    if (target == null) {
      return;
    }
    this._recipeRepository
      .update({ ...recipe, course: target })
      .subscribe(() => {
        for (const column of this.columns) {
          if (column.course === recipe.course || column.course === target) {
            column.recipes.reload();
          }
        }
      });
  }
}
