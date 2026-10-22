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

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(pick).toHaveBeenCalledExactlyOnceWith([shakshuka, cheesecake]);
    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('searches only the chosen course', async () => {
    const { fixture, search } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Desserts');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('stops filtering by course when "Any" is chosen', async () => {
    const { fixture, search } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Mains');
    await fixture.whenStable();
    clickToggle(fixture.nativeElement, 'Any');
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
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

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
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

    search.mockReturnValue(of([cheesecake]));
    pick.mockReturnValue(cheesecake);
    clickToggle(fixture.nativeElement, 'Desserts');
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
    expect(pick).toHaveBeenLastCalledWith([cheesecake]);
    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('links the surprise to its recipe page', async () => {
    const { fixture, search, pick } = mountSurpriseMe();
    pick.mockReturnValue(shakshuka);
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(root.querySelector('.eyebrow')?.textContent?.trim()).toBe('🎲 main');
    expect(root.querySelector('a')?.getAttribute('href')).toBe(
      '/recipes/shakshuka',
    );
  });

  it('keeps the chosen course when asked again', async () => {
    const { fixture, search } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Mains');
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Surprise me again').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('shows a message when the chosen course has no recipes', async () => {
    const { fixture, search } = mountSurpriseMe();
    await fixture.whenStable();

    search.mockReturnValue(of([]));
    clickToggle(fixture.nativeElement, 'Starters');
    await fixture.whenStable();

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

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([shakshuka, cheesecake]));
  const pick = vi
    .spyOn(TestBed.inject(RandomAdapter), 'pick')
    .mockReturnValue(shakshuka);

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
