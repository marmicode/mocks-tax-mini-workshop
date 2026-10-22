import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { COURSES } from '@whiskmate/shared-recipe/model';
import { courseLabel } from './course-label';
import { recipeDiscoverRouterHelper } from './recipe-discover.router-helper';

@Component({
  selector: 'wm-course-counts',
  imports: [RouterLink],
  template: `
    <ul>
      @for (count of counts.value() ?? []; track count.course) {
        <li>
          <a
            [routerLink]="count.route"
            [attr.data-course]="count.course"
            data-testid="course-count"
            >{{ count.label }} ({{ count.recipeCount }})</a
          >
        </li>
      }
    </ul>
  `,
  styles: `
    ul {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      list-style: none;
      margin: 0 0 2rem;
      padding: 0;
    }

    a {
      align-items: center;
      background: var(--mat-sys-primary-container);
      border-radius: 16px;
      color: var(--mat-sys-on-primary-container);
      display: flex;
      font: var(--mat-sys-title-large);
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      text-decoration: none;
      transition:
        box-shadow 150ms,
        transform 150ms;

      &::before {
        font-size: 2rem;
      }

      &:hover {
        box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
        transform: translateY(-2px);
      }
    }

    a[data-course='starter']::before {
      content: '🥗';
    }

    a[data-course='main']::before {
      content: '🍲';
    }

    a[data-course='dessert']::before {
      content: '🍰';
    }
  `,
})
export class CourseCounts {
  private _recipeRepository = inject(RecipeRepository);

  counts = rxResource({
    stream: () =>
      forkJoin(
        COURSES.map((course) =>
          this._recipeRepository
            .search({
              keywords: '',
              maxIngredientCount: null,
              maxStepCount: null,
              courses: [course],
            })
            .pipe(
              map((recipes) => ({
                course,
                label: courseLabel(course),
                recipeCount: recipes.length,
                route: recipeDiscoverRouterHelper.course(course),
              })),
            ),
        ),
      ),
  });
}
