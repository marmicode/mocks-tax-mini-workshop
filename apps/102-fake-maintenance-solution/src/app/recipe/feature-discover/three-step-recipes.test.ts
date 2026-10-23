import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { ThreeStepRecipes } from './three-step-recipes.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .withSteps(['Burn the aubergine.', 'Dress with tahini.'])
  .build();

const lamb = recipeMother
  .withBasicInfo('Slow-roasted Lamb')
  .withManySteps()
  .build();

describe(ThreeStepRecipes.name, () => {
  it('searches recipes with at most three steps', async () => {
    const { fixture } = mountThreeStepRecipes();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('shows the three-step recipes', async () => {
    const { fixture } = mountThreeStepRecipes({ recipes: [hummus, salad] });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('shows the steps of each recipe', async () => {
    const { fixture } = mountThreeStepRecipes({ recipes: [salad] });
    await fixture.whenStable();

    expect(steps(fixture.nativeElement)).toEqual([
      'Burn the aubergine.',
      'Dress with tahini.',
    ]);
  });

  it('links each recipe to its detail page', async () => {
    const { fixture } = mountThreeStepRecipes({ recipes: [hummus] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="recipe-name"]')
        ?.getAttribute('href'),
    ).toBe(`/recipes/${hummus.id}`);
  });

  it('shows a message when there are no three-step recipes', async () => {
    const { fixture } = mountThreeStepRecipes({ recipes: [lamb] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No three-step recipes found');
  });
});

function mountThreeStepRecipes({
  recipes = [hummus, salad, lamb],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(ThreeStepRecipes);

  return { fixture };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function steps(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-step"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
