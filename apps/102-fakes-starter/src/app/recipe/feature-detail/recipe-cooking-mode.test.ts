import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeCookingMode } from './recipe-cooking-mode.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [
    { quantity: { amount: 400, unit: 'g' }, name: 'tinned chickpeas' },
    { name: 'tahini' },
  ],
  steps: ['Blitz the chickpeas.', 'Add the tahini.', 'Top with the beans.'],
};

describe(RecipeCookingMode.name, () => {
  it('starts at the first step of the recipe', async () => {
    const { fixture } = mountCookingMode('hummus-ful');
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'step-counter')).toBe('Step 1 of 3');
    expect(textOf(fixture.nativeElement, 'current-step')).toBe(
      'Blitz the chickpeas.',
    );
    expect(buttonByText(fixture.nativeElement, 'Previous').disabled).toBe(true);
  });

  it('goes to the next step', async () => {
    const { fixture } = mountCookingMode('hummus-ful');
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Next').click();
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'step-counter')).toBe('Step 2 of 3');
    expect(textOf(fixture.nativeElement, 'current-step')).toBe(
      'Add the tahini.',
    );
  });

  it('goes back to the previous step', async () => {
    const { fixture } = mountCookingMode('hummus-ful');
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Next').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Previous').click();
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'step-counter')).toBe('Step 1 of 3');
  });

  it('wishes a nice meal on the last step', async () => {
    const { fixture } = mountCookingMode('hummus-ful');
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Next').click();
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Next').click();
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'step-counter')).toBe('Step 3 of 3');
    expect(buttonByText(fixture.nativeElement, 'Next').disabled).toBe(true);
    expect(textOf(fixture.nativeElement, 'done-message')).toContain(
      'Enjoy your meal!',
    );
  });

  it('lists ingredients as a checklist', async () => {
    const { fixture } = mountCookingMode('hummus-ful');
    await fixture.whenStable();

    expect(
      [...fixture.nativeElement.querySelectorAll('mat-checkbox')].map((el) =>
        (el as HTMLElement).textContent?.trim(),
      ),
    ).toEqual(['tinned chickpeas', 'tahini']);
  });

  it('shows a message when the recipe does not exist', async () => {
    const { fixture } = mountCookingMode('missing');
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'recipe-not-found')).toBe(
      'This recipe does not exist.',
    );
  });
});

function mountCookingMode(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([hummus]);

  const fixture = TestBed.createComponent(RecipeCookingMode);
  fixture.componentRef.setInput('recipeId', recipeId);

  return { fixture };
}

function textOf(root: HTMLElement, testId: string): string | undefined {
  return root
    .querySelector(`[data-testid="${testId}"]`)
    ?.textContent?.trim()
    .replace(/\s+/g, ' ');
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
