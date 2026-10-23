import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import {
  MatMenu,
  MatMenuContent,
  MatMenuItem,
  MatMenuTrigger,
} from '@angular/material/menu';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { adminRouterHelper } from '@whiskmate/admin/feature-admin';
import { adminCatalogRouterHelper } from '@whiskmate/admin/feature-catalog';
import { adminRecipesRouterHelper } from '@whiskmate/admin/feature-recipes';
import { CurrentUser } from '@whiskmate/authz/domain';
import { mealPlanRouterHelper } from '@whiskmate/meal-plan/feature-meal-plan';
import { shoppingListRouterHelper } from '@whiskmate/meal-plan/feature-shopping-list';
import { recipeDiscoverRouterHelper } from '@whiskmate/recipe/feature-discover';
import {
  RecipeQuickSearch,
  recipeRouterHelper,
} from '@whiskmate/recipe/feature-search';
import { Navbar } from '@whiskmate/shared/ui';

interface NavLink {
  label: string;
  icon: string;
  route: string[];
}

interface NavSection {
  label: string;
  icon: string;
  /**
   * Url prefix used to highlight the section.
   */
  prefix: string;
  links: NavLink[];
}

@Component({
  imports: [
    MatIcon,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    Navbar,
    RecipeQuickSearch,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  selector: 'wm-root',
  template: `<wm-navbar title="👨🏻‍🍳 Whiskmate">
      <div class="nav" data-slot="nav">
        <button
          type="button"
          class="menu-toggle wm-plain"
          aria-label="Menu"
          [matMenuTriggerFor]="mobileMenu"
        >
          <mat-icon>menu</mat-icon>
        </button>
        @for (item of navItems(); track item.label) {
          @if (isSection(item)) {
            <button
              type="button"
              class="nav-item wm-plain"
              [class.active]="isActive(item.prefix)"
              [matMenuTriggerFor]="sectionMenu"
              [matMenuTriggerData]="{ section: item }"
            >
              <mat-icon>{{ item.icon }}</mat-icon>
              <span class="label">{{ item.label }}</span>
              <mat-icon class="chevron">expand_more</mat-icon>
            </button>
          } @else {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
            >
              <mat-icon>{{ item.icon }}</mat-icon>
              <span class="label">{{ item.label }}</span>
            </a>
          }
        }
      </div>
      <div class="actions" data-slot="actions">
        <wm-recipe-quick-search />
        @if (isAdmin()) {
          <button type="button" class="session wm-plain" (click)="signOut()">
            <mat-icon>logout</mat-icon>
            <span class="label">Sign out</span>
          </button>
        } @else {
          <button type="button" class="session wm-plain" (click)="signIn()">
            <mat-icon>login</mat-icon>
            <span class="label">Sign in</span>
          </button>
        }
      </div>
    </wm-navbar>

    <mat-menu #sectionMenu="matMenu">
      <ng-template matMenuContent let-section="section">
        @for (link of section.links; track link.label) {
          <a mat-menu-item [routerLink]="link.route">
            <mat-icon>{{ link.icon }}</mat-icon>
            <span>{{ link.label }}</span>
          </a>
        }
      </ng-template>
    </mat-menu>

    <mat-menu #mobileMenu="matMenu">
      <ng-template matMenuContent>
        @for (link of allLinks(); track link.label) {
          <a mat-menu-item [routerLink]="link.route">
            <mat-icon>{{ link.icon }}</mat-icon>
            <span>{{ link.label }}</span>
          </a>
        }
      </ng-template>
    </mat-menu>

    <router-outlet />`,
  styles: `
    .nav {
      display: flex;
      gap: 0.25rem;
    }

    .nav-item,
    .session,
    .menu-toggle {
      align-items: center;
      background: none;
      border: none;
      border-radius: 999px;
      color: rgb(255 255 255 / 85%);
      cursor: pointer;
      display: inline-flex;
      font:
        500 0.95rem/1 Roboto,
        sans-serif;
      gap: 0.4rem;
      height: 40px;
      padding: 0 0.9rem;
      text-decoration: none;
      white-space: nowrap;

      &:hover {
        background: rgb(255 255 255 / 10%);
        color: white;
      }

      &.active {
        background: rgb(255 255 255 / 18%);
        color: white;
      }

      mat-icon {
        font-size: 20px;
        height: 20px;
        width: 20px;
      }

      .chevron {
        margin-left: -0.25rem;
      }
    }

    .session {
      border: 1px solid rgb(255 255 255 / 50%);
    }

    .menu-toggle {
      display: none;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    @media (max-width: 1100px) {
      .nav-item .label,
      .session .label {
        display: none;
      }
    }

    @media (max-width: 760px) {
      .nav-item,
      wm-recipe-quick-search {
        display: none;
      }

      .menu-toggle {
        display: inline-flex;
      }
    }
  `,
})
export class App {
  private _currentUser = inject(CurrentUser);
  private _router = inject(Router);

  isAdmin = this._currentUser.isAdmin;

  private _url = toSignal(
    this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this._router.url },
  );

  navItems = computed<Array<NavLink | NavSection>>(() => [
    {
      label: 'Search',
      icon: 'search',
      route: recipeRouterHelper.search(),
    },
    {
      label: 'Discover',
      icon: 'explore',
      prefix: '/discover',
      links: [
        {
          label: 'Overview',
          icon: 'explore',
          route: recipeDiscoverRouterHelper.discover(),
        },
        {
          label: 'Recipe of the day',
          icon: 'today',
          route: recipeDiscoverRouterHelper.today(),
        },
        {
          label: 'Quick recipes',
          icon: 'bolt',
          route: recipeDiscoverRouterHelper.quick(),
        },
        {
          label: 'Surprise me',
          icon: 'casino',
          route: recipeDiscoverRouterHelper.surprise(),
        },
        {
          label: 'Favorites',
          icon: 'favorite',
          route: recipeDiscoverRouterHelper.favorites(),
        },
        {
          label: 'Recently viewed',
          icon: 'history',
          route: recipeDiscoverRouterHelper.recentlyViewed(),
        },
        {
          label: 'Ingredient index',
          icon: 'sort_by_alpha',
          route: recipeDiscoverRouterHelper.ingredients(),
        },
        {
          label: 'What can I cook?',
          icon: 'kitchen',
          route: recipeDiscoverRouterHelper.pantry(),
        },
        {
          label: 'Menu builder',
          icon: 'restaurant_menu',
          route: recipeDiscoverRouterHelper.menuBuilder(),
        },
      ],
    },
    {
      label: 'Meal plan',
      icon: 'calendar_month',
      route: mealPlanRouterHelper.mealPlan(),
    },
    {
      label: 'Shopping list',
      icon: 'shopping_cart',
      route: shoppingListRouterHelper.shoppingList(),
    },
    ...(this.isAdmin()
      ? [
          {
            label: 'Admin',
            icon: 'admin_panel_settings',
            prefix: '/admin',
            links: [
              {
                label: 'Dashboard',
                icon: 'dashboard',
                route: adminRouterHelper.admin(),
              },
              {
                label: 'Recipes',
                icon: 'menu_book',
                route: adminRecipesRouterHelper.list(),
              },
              {
                label: 'New recipe',
                icon: 'add',
                route: adminRecipesRouterHelper.create(),
              },
              {
                label: 'Course board',
                icon: 'view_kanban',
                route: adminCatalogRouterHelper.courses(),
              },
              {
                label: 'Quality report',
                icon: 'fact_check',
                route: adminCatalogRouterHelper.quality(),
              },
              {
                label: 'Duplicates',
                icon: 'content_copy',
                route: adminCatalogRouterHelper.duplicates(),
              },
              {
                label: 'Ingredients',
                icon: 'egg',
                route: adminCatalogRouterHelper.ingredients(),
              },
              {
                label: 'Export',
                icon: 'download',
                route: adminCatalogRouterHelper.export(),
              },
              {
                label: 'Import',
                icon: 'upload',
                route: adminCatalogRouterHelper.import(),
              },
            ],
          },
        ]
      : []),
  ]);

  allLinks = computed(() =>
    this.navItems().flatMap((item) =>
      this.isSection(item)
        ? item.links.map((link) => ({
            ...link,
            label: `${item.label} · ${link.label}`,
          }))
        : [item],
    ),
  );

  isSection(item: NavLink | NavSection): item is NavSection {
    return 'links' in item;
  }

  isActive(prefix: string): boolean {
    return this._url().startsWith(prefix);
  }

  signIn(): void {
    this._currentUser.signInAsAdmin();
  }

  signOut(): void {
    this._currentUser.signOut();
  }
}
