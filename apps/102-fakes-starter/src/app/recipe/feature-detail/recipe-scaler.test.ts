import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeScaler } from './recipe-scaler.ng';

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [
    { quantity: { amount: 250, unit: 'g' }, name: 'ricotta' },
    { quantity: { amount: 3, unit: '' }, name: 'eggs' },
    { name: 'zest of 2 lemons' },
  ],
  steps: [],
};

describe(RecipeScaler.name, () => {
  it('shows quantities for 4 servings by default', async () => {
    const { fixture, findById } = mountRecipeScaler('lemon-ricotta-cheesecake');
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({
      id: 'lemon-ricotta-cheesecake',
    });
    expect(scaledIngredients(fixture.nativeElement)).toEqual([
      '250 g ricotta',
      '3 eggs',
      'zest of 2 lemons',
    ]);
  });

  it('doubles quantities for 8 servings', async () => {
    const { fixture, findById } = mountRecipeScaler('lemon-ricotta-cheesecake');
    await fixture.whenStable();

    typeInto(servingsInput(fixture.nativeElement), '8');
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({
      id: 'lemon-ricotta-cheesecake',
    });
    expect(scaledIngredients(fixture.nativeElement)).toEqual([
      '500 g ricotta',
      '6 eggs',
      'zest of 2 lemons',
    ]);
  });

  it('rounds scaled quantities to one decimal', async () => {
    const { fixture } = mountRecipeScaler('lemon-ricotta-cheesecake');
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
    const { fixture } = mountRecipeScaler('lemon-ricotta-cheesecake');
    await fixture.whenStable();

    typeInto(servingsInput(fixture.nativeElement), '0');
    await fixture.whenStable();

    expect(scaledIngredients(fixture.nativeElement)[0]).toBe('250 g ricotta');
  });

  it('shows a message when the recipe does not exist', async () => {
    const { fixture, findById } = mountRecipeScaler('missing');
    findById.mockReturnValue(of(undefined));
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(
      fixture.nativeElement.querySelector('[data-testid="recipe-not-found"]')
        ?.textContent,
    ).toContain('This recipe does not exist.');
  });
});

function mountRecipeScaler(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(cheesecake));

  const fixture = TestBed.createComponent(RecipeScaler);
  fixture.componentRef.setInput('recipeId', recipeId);

  return { fixture, findById };
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
