import { TestBed } from '@angular/core/testing';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { App } from './app';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(App.name, () => {
  it('searches all recipes', async () => {
    TestBed.configureTestingModule({
      providers: [provideRecipeRepositoryFake()],
    });
    TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka, cheesecake]);

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
  });
});

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
