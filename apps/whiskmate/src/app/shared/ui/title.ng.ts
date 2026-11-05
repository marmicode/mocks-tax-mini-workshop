import { Component, input } from '@angular/core';

@Component({
  selector: 'wm-navbar',
  template: `<div class="brand">
      <span class="title">{{ title() }}</span>
    </div>
    <nav class="nav">
      <ng-content select="[data-slot=nav]" />
    </nav>
    <div class="actions">
      <ng-content select="[data-slot=actions]" />
    </div>`,
  styles: `
    :host {
      align-items: center;
      background: #380030;
      box-shadow: 0 2px 8px rgb(0 0 0 / 25%);
      color: #fff;
      display: flex;
      gap: 1.5rem;
      height: 64px;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      align-items: center;
      display: flex;
      gap: 0.5rem;
    }

    .title {
      font-size: 1.4rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .nav {
      align-items: center;
      display: flex;
      flex: 1;
      gap: 0.25rem;
      min-width: 0;
    }

    .actions {
      align-items: center;
      display: flex;
      gap: 0.75rem;
    }
  `,
})
export class Navbar {
  title = input.required<string>();
}
