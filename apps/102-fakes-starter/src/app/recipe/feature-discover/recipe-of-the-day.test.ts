import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import {
  ClockAdapterFake,
  provideClockAdapterFake,
} from '@whiskmate/shared/infra';
import { RecipeOfTheDay } from './recipe-of-the-day.ng';

const shakshuka = recipeMother
  .withBasicInfo({
    name: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato sauce.',
  })
  .build();

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .build();

describe(RecipeOfTheDay.name, () => {
  it('picks the recipe matching the day of the year', async () => {
    /* January 2nd is the 2nd day of the year: 2 % 3 = 2. */
    const { fixture } = mountRecipeOfTheDay(new Date(2026, 0, 2));
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('picks another recipe the next day', async () => {
    /* January 3rd is the 3rd day of the year: 3 % 3 = 0. */
    const { fixture } = mountRecipeOfTheDay(new Date(2026, 0, 3));
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe('Shakshuka');
  });

  it('shows the description, picture and a link to the recipe', async () => {
    const { fixture } = mountRecipeOfTheDay(new Date(2026, 0, 3));
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(
      root.querySelector('[data-testid="recipe-description"]')?.textContent,
    ).toContain('Eggs poached in a spiced tomato sauce.');
    expect(root.querySelector('img')?.getAttribute('src')).toBe(
      shakshuka.pictureUri,
    );
    expect(root.querySelector('a')?.getAttribute('href')).toBe(
      `/recipes/${shakshuka.id}`,
    );
  });

  it('shows a message when there are no recipes', async () => {
    const { fixture } = mountRecipeOfTheDay(new Date(2026, 0, 3), {
      recipes: [],
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipe today');
  });

  it('hides the description when the recipe has none', async () => {
    /* January 1st is the 1st day of the year: 1 % 3 = 1. */
    const { fixture } = mountRecipeOfTheDay(new Date(2026, 0, 1));
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe('Hummus with Ful');
    expect(
      fixture.nativeElement.querySelector('[data-testid="recipe-description"]'),
    ).toBeNull();
  });

  it("shows the course of today's pick", async () => {
    const { fixture } = mountRecipeOfTheDay(new Date(2026, 0, 1));
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('.eyebrow')?.textContent?.trim(),
    ).toBe("Today's pick · starter");
  });

  it('counts days across months', async () => {
    /* February 1st is the 32nd day of the year: 32 % 3 = 2. */
    const { fixture } = mountRecipeOfTheDay(new Date(2026, 1, 1));
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('always picks the only recipe of the catalog', async () => {
    const { fixture } = mountRecipeOfTheDay(new Date(2026, 11, 31), {
      recipes: [hummus],
    });
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe('Hummus with Ful');
  });
});

function mountRecipeOfTheDay(
  now: Date,
  { recipes = [shakshuka, hummus, cheesecake] }: { recipes?: Recipe[] } = {},
) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideClockAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  TestBed.inject(ClockAdapterFake).setNow(now);

  const fixture = TestBed.createComponent(RecipeOfTheDay);

  return { fixture };
}

function recipeName(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="recipe-name"]')?.textContent?.trim();
}
