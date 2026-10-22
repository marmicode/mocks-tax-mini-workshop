import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseCounts } from './course-counts.ng';
import { recipeDiscoverRouterHelper } from './recipe-discover.router-helper';

@Component({
  selector: 'wm-discover',
  imports: [CourseCounts, RouterLink],
  template: `
    <h2>Discover</h2>
    <h3>Browse by course</h3>
    <wm-course-counts />
    <h3>Find inspiration</h3>
    <div class="pages">
      @for (page of pages; track page.title) {
        <a class="page" [routerLink]="page.route">
          <span class="emoji">{{ page.emoji }}</span>
          <strong>{{ page.title }}</strong>
          <span>{{ page.description }}</span>
        </a>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .pages {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }

    .page {
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 2px 8px rgb(0 0 0 / 6%);
      color: var(--mat-sys-on-surface);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding: 1.25rem;
      text-decoration: none;
      transition:
        box-shadow 150ms,
        transform 150ms;

      strong {
        font: var(--mat-sys-title-medium);
      }

      span:last-child {
        color: var(--mat-sys-on-surface-variant);
      }

      &:hover {
        box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
        transform: translateY(-2px);
      }
    }

    .emoji {
      align-items: center;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
      display: flex;
      font-size: 1.6rem;
      height: 48px;
      justify-content: center;
      margin-bottom: 0.4rem;
      width: 48px;
    }
  `,
})
export class Discover {
  readonly pages = [
    {
      emoji: '📅',
      title: 'Recipe of the day',
      description: 'A new idea every day.',
      route: recipeDiscoverRouterHelper.today(),
    },
    {
      emoji: '⚡️',
      title: 'Quick recipes',
      description: 'Ready in a few steps.',
      route: recipeDiscoverRouterHelper.quick(),
    },
    {
      emoji: '🎲',
      title: 'Surprise me',
      description: 'Let chance pick your next meal.',
      route: recipeDiscoverRouterHelper.surprise(),
    },
    {
      emoji: '❤️',
      title: 'Favorites',
      description: 'The recipes you love.',
      route: recipeDiscoverRouterHelper.favorites(),
    },
    {
      emoji: '🕘',
      title: 'Recently viewed',
      description: 'Pick up where you left off.',
      route: recipeDiscoverRouterHelper.recentlyViewed(),
    },
    {
      emoji: '🧄',
      title: 'Ingredient index',
      description: 'Browse recipes by ingredient.',
      route: recipeDiscoverRouterHelper.ingredients(),
    },
    {
      emoji: '🥫',
      title: 'Pantry',
      description: 'Cook with what you have.',
      route: recipeDiscoverRouterHelper.pantry(),
    },
    {
      emoji: '🍽️',
      title: 'Menu builder',
      description: 'Starter, main and dessert.',
      route: recipeDiscoverRouterHelper.menuBuilder(),
    },
  ];
}
