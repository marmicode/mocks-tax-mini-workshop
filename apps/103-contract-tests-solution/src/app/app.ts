import { Component } from '@angular/core';
import { RecipeSearch } from '@whiskmate/recipe/feature-search';
import { Navbar } from '@whiskmate/shared/ui';

@Component({
  imports: [Navbar, RecipeSearch],
  selector: 'wm-root',
  template: `<wm-navbar title="👨🏻‍🍳 Whiskmate" /> <wm-recipe-search />`,
})
export class App {}
