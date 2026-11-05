import { Component, input } from '@angular/core';

@Component({
  selector: 'wm-card',
  template: `@if (pictureUri()) {
      <img class="picture" [src]="pictureUri()" [alt]="pictureAlt()" />
    }

    <div class="content">
      <ng-content />
    </div>`,
  styles: `
    :host {
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 2px 8px rgb(0 0 0 / 6%);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      text-align: left;
      transition:
        box-shadow 150ms,
        transform 150ms;
      width: var(--wm-card-width, 300px);
    }

    :host:hover {
      box-shadow:
        0 2px 4px rgb(0 0 0 / 10%),
        0 8px 24px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
    }

    .picture {
      aspect-ratio: 4 / 3;
      display: block;
      object-fit: cover;
      width: 100%;
    }

    .content {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 1rem 1rem;
    }
  `,
})
export class Card {
  pictureUri = input<string>();
  pictureAlt = input<string>('');
}
