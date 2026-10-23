import { Component, input } from '@angular/core';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { Card } from '@whiskmate/shared/ui';

@Component({
  selector: 'wm-recipe-preview',
  imports: [Card],
  template: `<wm-card
    [pictureUri]="recipe().pictureUri"
    [pictureAlt]="recipe().name"
  >
    <span class="course">{{ recipe().course }}</span>
    <h2 data-testid="recipe-name">{{ recipe().name }}</h2>
  </wm-card>`,
  styles: `
    .course {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-medium);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    h2 {
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      font: var(--mat-sys-title-medium);
      line-height: 1.3;
      margin: 0;
      min-height: 2.6em;
      overflow: hidden;
    }
  `,
})
export class RecipePreview {
  recipe = input.required<Recipe>();
}
