import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { RecipeScaler } from './recipe-scaler.ng';

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .withIngredients([
    { quantity: { amount: 250, unit: 'g' }, name: 'ricotta' },
    { quantity: { amount: 3, unit: '' }, name: 'eggs' },
    { name: 'zest of 2 lemons' },
  ])
  .build();

describe(RecipeScaler.name, () => {
  it('shows quantities for 4 servings by default', async () => {
    const { fixture } = mountRecipeScaler(cheesecake.id);
    await fixture.whenStable();

    expect(scaledIngredients(fixture.nativeElement)).toEqual([
      '250 g ricotta',
      '3 eggs',
      'zest of 2 lemons',
    ]);
  });

  it('doubles quantities for 8 servings', async () => {
    const { fixture } = mountRecipeScaler(cheesecake.id);
    await fixture.whenStable();

    typeInto(servingsInput(fixture.nativeElement), '8');
    await fixture.whenStable();

    expect(scaledIngredients(fixture.nativeElement)).toEqual([
      '500 g ricotta',
      '6 eggs',
      'zest of 2 lemons',
    ]);
  });

  it('rounds scaled quantities to one decimal', async () => {
    const { fixture } = mountRecipeScaler(cheesecake.id);
    await fixture.whenStable();

    typeInto(servingsInput(fixture.nativeElement), '3');
    await fixture.whenStable();

    expect(scaledIngredients(fixture.nativeElement)).toEqual([
      '187.5 g ricotta',
      '2.3 eggs',
      'zest of 2 lemons',
    ]);
  });

  it('ignores invalid servings', async () => {
    const { fixture } = mountRecipeScaler(cheesecake.id);
    await fixture.whenStable();

    typeInto(servingsInput(fixture.nativeElement), '0');
    await fixture.whenStable();

    expect(scaledIngredients(fixture.nativeElement)[0]).toBe('250 g ricotta');
  });

  it('shows a message when the recipe does not exist', async () => {
    const { fixture } = mountRecipeScaler('missing');
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="recipe-not-found"]')
        ?.textContent,
    ).toContain('This recipe does not exist.');
  });
});

function mountRecipeScaler(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([cheesecake]);

  const fixture = TestBed.createComponent(RecipeScaler);
  fixture.componentRef.setInput('recipeId', recipeId);

  return { fixture };
}

function scaledIngredients(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="scaled-ingredient"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function servingsInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>('input[type="number"]');
  if (input == null) {
    throw new Error('Servings input not found.');
  }
  return input;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}
