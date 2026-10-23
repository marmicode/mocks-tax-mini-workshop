import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeCompare } from './recipe-compare.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: 'Olive oil' },
    { name: 'garlic, crushed' },
    { name: 'large eggs' },
  ],
  steps: ['Heat the oil.', 'Add the eggs.'],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'olive oil' }, { name: 'tahini' }],
  steps: ['Blitz everything.'],
};

describe(RecipeCompare.name, () => {
  it('lists all recipes in the pickers', async () => {
    const { fixture, search, findById } = mountRecipeCompare({});
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(findById).not.toHaveBeenCalled();
    expect(optionLabels(selects(fixture.nativeElement)[0])).toEqual([
      'Pick a recipe',
      'Shakshuka',
      'Hummus with Ful',
    ]);
  });

  it('fetches both compared recipes', async () => {
    const { fixture, search, findById } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(findById).toHaveBeenCalledTimes(2);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'shakshuka' });
    expect(findById).toHaveBeenNthCalledWith(2, { id: 'hummus-ful' });
  });

  it('compares course, ingredient count and step count', async () => {
    const { fixture, search } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(textOf(root, 'left-name')).toBe('Shakshuka');
    expect(textOf(root, 'right-name')).toBe('Hummus with Ful');
    expect(cellsOf(root, 'course-row')).toEqual(['main', 'starter']);
    expect(cellsOf(root, 'ingredient-count-row')).toEqual(['3', '2']);
    expect(cellsOf(root, 'step-count-row')).toEqual(['2', '1']);
  });

  it('lists shared ingredients ignoring case', async () => {
    const { fixture } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });
    await fixture.whenStable();

    expect(
      [
        ...fixture.nativeElement.querySelectorAll(
          '[data-testid="shared-ingredient"]',
        ),
      ].map((el) => (el as HTMLElement).textContent?.trim()),
    ).toEqual(['olive oil']);
  });

  it('navigates when a recipe is picked', async () => {
    const { fixture, search } = mountRecipeCompare({});
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    await fixture.whenStable();

    const [leftSelect] = selects(fixture.nativeElement);
    leftSelect.value = 'hummus-ful';
    leftSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'compare'], {
      queryParams: { left: 'hummus-ful' },
      queryParamsHandling: 'merge',
    });
  });

  it('preselects the compared recipes in the pickers', async () => {
    const { fixture, search } = mountRecipeCompare({
      left: 'hummus-ful',
      right: 'shakshuka',
    });
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(
      selects(fixture.nativeElement).map((select) => select.value),
    ).toEqual(['hummus-ful', 'shakshuka']);
  });

  it('does not compare until both recipes are picked', async () => {
    const { fixture, search, findById } = mountRecipeCompare({
      left: 'shakshuka',
    });
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('tells when recipes share no ingredients', async () => {
    const { fixture, search, findById } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });
    findById.mockImplementation(({ id }) =>
      of(
        id === 'shakshuka'
          ? shakshuka
          : { ...hummus, ingredients: [{ name: 'tahini' }] },
      ),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(textOf(fixture.nativeElement, 'no-shared-ingredients')).toBe(
      'No shared ingredients.',
    );
  });

  it('clears a side when "Pick a recipe" is chosen', async () => {
    const { fixture, search } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    await fixture.whenStable();

    const [, rightSelect] = selects(fixture.nativeElement);
    rightSelect.value = '';
    rightSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'compare'], {
      queryParams: { right: null },
      queryParamsHandling: 'merge',
    });
  });
});

function mountRecipeCompare({
  left,
  right,
}: {
  left?: string;
  right?: string;
}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const recipeRepository = TestBed.inject(RecipeRepository);
  const search = vi
    .spyOn(recipeRepository, 'search')
    .mockReturnValue(of([shakshuka, hummus]));
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockImplementation(({ id }) =>
      of([shakshuka, hummus].find((recipe) => recipe.id === id)),
    );

  const fixture = TestBed.createComponent(RecipeCompare);
  fixture.componentRef.setInput('left', left);
  fixture.componentRef.setInput('right', right);

  return { fixture, search, findById };
}

function selects(root: HTMLElement): HTMLSelectElement[] {
  return [...root.querySelectorAll('select')];
}

function optionLabels(select: HTMLSelectElement | undefined): string[] {
  return [...(select?.options ?? [])].map((option) => option.text.trim());
}

function textOf(root: HTMLElement, testId: string): string | undefined {
  return root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
}

function cellsOf(root: HTMLElement, testId: string): string[] {
  return [...root.querySelectorAll(`[data-testid="${testId}"] td`)].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
