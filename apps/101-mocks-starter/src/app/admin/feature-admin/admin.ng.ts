import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CatalogStats } from '@whiskmate/admin/domain';
import { adminCatalogRouterHelper } from '@whiskmate/admin/feature-catalog';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import { COURSES } from '@whiskmate/shared-recipe/model';

@Component({
  selector: 'wm-admin',
  imports: [MatIcon, RouterLink],
  template: `
    <h2>Kitchen admin</h2>
    @if (stats.hasValue()) {
      @let summary = stats.value();
      <section class="tiles">
        <div class="tile wm-surface" data-testid="stat-tile">
          <span class="value">{{ summary.recipeCount }}</span>
          <span class="label">Recipes</span>
        </div>
        @for (course of courses; track course) {
          <div class="tile wm-surface" data-testid="stat-tile">
            <span class="value">{{ summary.countByCourse[course] }}</span>
            <span class="label">{{ course }}s</span>
          </div>
        }
        <div class="tile wm-surface" data-testid="stat-tile">
          <span class="value">{{
            formatAverage(summary.averageIngredientCount)
          }}</span>
          <span class="label">Avg. ingredients</span>
        </div>
        <div class="tile wm-surface" data-testid="stat-tile">
          <span class="value">{{
            formatAverage(summary.averageStepCount)
          }}</span>
          <span class="label">Avg. steps</span>
        </div>
        <div
          class="tile wm-surface"
          data-testid="stat-tile"
          [class.warning]="summary.missingDescriptionCount > 0"
        >
          <span class="value">{{ summary.missingDescriptionCount }}</span>
          <span class="label">Missing descriptions</span>
        </div>
      </section>
    } @else if (stats.isLoading()) {
      <p class="wm-muted">Loading…</p>
    }
    <h3>Tools</h3>
    <nav class="tools">
      @for (link of links; track link.label) {
        <div class="tool wm-surface">
          <mat-icon class="icon">{{ link.icon }}</mat-icon>
          <div>
            <a class="title" [routerLink]="link.route">{{ link.label }}</a>
            <p class="description wm-muted">{{ link.description }}</p>
          </div>
        </div>
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .tiles {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      margin-bottom: 2rem;
    }

    .tile {
      border-top: 4px solid var(--mat-sys-primary);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .tile.warning {
      border-top-color: var(--mat-sys-error);
    }

    .value {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-display-small);
    }

    .tile.warning .value {
      color: var(--mat-sys-error);
    }

    .label {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
      text-transform: capitalize;
    }

    .tools {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }

    .tool {
      align-items: flex-start;
      display: flex;
      gap: 1rem;
      position: relative;
      transition: box-shadow 120ms;

      &:hover {
        box-shadow:
          0 2px 4px rgb(0 0 0 / 10%),
          0 6px 16px rgb(0 0 0 / 10%);
      }
    }

    .icon {
      background: var(--mat-sys-primary-container);
      border-radius: 12px;
      color: var(--mat-sys-on-primary-container);
      flex-shrink: 0;
      padding: 0.5rem;
    }

    .title {
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-title-medium);

      /* The whole card is clickable. */
      &::after {
        content: '';
        inset: 0;
        position: absolute;
      }
    }

    .description {
      font: var(--mat-sys-body-medium);
      margin: 0.25rem 0 0;
    }
  `,
})
export class Admin {
  protected readonly courses = COURSES;

  protected readonly links = [
    {
      label: 'Recipes',
      icon: 'menu_book',
      description: 'Browse, edit and delete recipes.',
      route: adminRecipesRouterHelper.list(),
    },
    {
      label: 'New recipe',
      icon: 'add_circle',
      description: 'Add a recipe to the catalog.',
      route: adminRecipesRouterHelper.create(),
    },
    {
      label: 'Duplicates',
      icon: 'content_copy',
      description: 'Spot recipes that look alike.',
      route: adminCatalogRouterHelper.duplicates(),
    },
    {
      label: 'Quality report',
      icon: 'fact_check',
      description: 'Find incomplete recipes.',
      route: adminCatalogRouterHelper.quality(),
    },
    {
      label: 'Courses',
      icon: 'view_kanban',
      description: 'Move recipes between courses.',
      route: adminCatalogRouterHelper.courses(),
    },
    {
      label: 'Ingredients',
      icon: 'egg',
      description: 'Rename ingredients across recipes.',
      route: adminCatalogRouterHelper.ingredients(),
    },
    {
      label: 'Export',
      icon: 'download',
      description: 'Download the catalog as JSON.',
      route: adminCatalogRouterHelper.export(),
    },
    {
      label: 'Import',
      icon: 'upload',
      description: 'Create or update recipes from JSON.',
      route: adminCatalogRouterHelper.import(),
    },
  ];

  private _catalogStats = inject(CatalogStats);

  protected stats = rxResource({
    stream: () => this._catalogStats.stats(),
  });

  protected formatAverage(value: number): string {
    return String(Math.round(value * 10) / 10);
  }
}
