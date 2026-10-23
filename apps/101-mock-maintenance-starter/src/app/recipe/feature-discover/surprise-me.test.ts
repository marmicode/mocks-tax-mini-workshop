import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RandomAdapter } from '@whiskmate/shared/infra';
import { SurpriseMe } from './surprise-me.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

describe(SurpriseMe.name, () => {
  it('picks a random recipe among all recipes', async () => {
    const { fixture, search, pick } = mountSurpriseMe();
    pick.mockReturnValue(cheesecake);
    await fixture.whenStable();

    expect(pick).toHaveBeenCalledExactlyOnceWith([shakshuka, cheesecake]);
    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('searches only the chosen course', async () => {
    const { fixture, search } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Desserts');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('stops filtering by course when "Any" is chosen', async () => {
    const { fixture, search, pick } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Mains');
    await fixture.whenStable();
    clickToggle(fixture.nativeElement, 'Any');
    await fixture.whenStable();

    expect(pick).toHaveBeenLastCalledWith([shakshuka, cheesecake]);
    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(search).toHaveBeenNthCalledWith(3, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(search.mock.lastCall?.[0]).not.toHaveProperty('courses');
  });

  it('picks another recipe when asked again', async () => {
    const { fixture, search, pick } = mountSurpriseMe();
    pick.mockReturnValueOnce(shakshuka).mockReturnValueOnce(cheesecake);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Surprise me again').click();
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows a message when there is nothing to pick', async () => {
    const { fixture, search, pick } = mountSurpriseMe();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(pick).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('Nothing to surprise you with');
  });

  it('picks among the recipes of the chosen course', async () => {
    const { fixture, search, pick } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Desserts');
    await fixture.whenStable();

    expect(pick).toHaveBeenLastCalledWith([cheesecake]);
    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('links the surprise to its recipe page', async () => {
    const { fixture, search } = mountSurpriseMe();
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.eyebrow')?.textContent?.trim()).toBe('🎲 main');
    expect(root.querySelector('a')?.getAttribute('href')).toBe(
      '/recipes/shakshuka',
    );
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('keeps the chosen course when asked again', async () => {
    const { fixture, search } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Mains');
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Surprise me again').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(search).toHaveBeenNthCalledWith(3, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('shows a message when the chosen course has no recipes', async () => {
    const { fixture, search, pick } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Starters');
    await fixture.whenStable();

    expect(pick).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('Nothing to surprise you with');
  });
});

function mountSurpriseMe() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const catalog = [shakshuka, cheesecake];
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) =>
      of(
        params.courses == null
          ? catalog
          : catalog.filter((recipe) => params.courses?.includes(recipe.course)),
      ),
    );
  const pick = vi
    .spyOn(TestBed.inject(RandomAdapter), 'pick')
    .mockImplementation((items) => items[0]);

  const fixture = TestBed.createComponent(SurpriseMe);

  return { fixture, search, pick };
}

function recipeName(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="recipe-name"]')?.textContent?.trim();
}

function clickToggle(root: HTMLElement, label: string): void {
  const toggle = [...root.querySelectorAll('mat-button-toggle')].find(
    (el) => el.textContent?.trim() === label,
  );
  const button = toggle?.querySelector('button');
  if (button == null) {
    throw new Error(`Toggle "${label}" not found.`);
  }
  button.click();
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
