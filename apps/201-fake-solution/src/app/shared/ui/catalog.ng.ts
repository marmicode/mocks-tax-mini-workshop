import { Component } from '@angular/core';

@Component({
  selector: 'wm-catalog',
  template: `<ng-content />`,
  styles: `
    :host {
      --wm-card-width: 100%;

      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      padding: 1.5rem 0;
    }
  `,
})
export class Catalog {}
