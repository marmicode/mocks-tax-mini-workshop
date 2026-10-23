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
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
import { SurpriseMe } from './surprise-me.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(SurpriseMe.name, () => {
  it('picks a random recipe among all recipes', async () => {
    const { fixture, randomAdapterFake } = mountSurpriseMe();
    randomAdapterFake.setPickIndex(-1);
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('searches only the chosen course', async () => {
    const { fixture } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Desserts');
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('stops filtering by course when "Any" is chosen', async () => {
    const { fixture, randomAdapterFake } = mountSurpriseMe();
    randomAdapterFake.setPickIndex(-1);
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Mains');
    await fixture.whenStable();
    expect(recipeName(fixture.nativeElement)).toBe('Shakshuka');

    clickToggle(fixture.nativeElement, 'Any');
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('picks another recipe when asked again', async () => {
    const { fixture, randomAdapterFake } = mountSurpriseMe();
    await fixture.whenStable();

    randomAdapterFake.setPickIndex(-1);
    buttonByText(fixture.nativeElement, 'Surprise me again').click();
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('shows a message when there is nothing to pick', async () => {
    const { fixture } = mountSurpriseMe({ recipes: [] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('Nothing to surprise you with');
  });

  it('picks among the recipes of the chosen course', async () => {
    const { fixture } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Desserts');
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('links the surprise to its recipe page', async () => {
    const { fixture } = mountSurpriseMe();
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.eyebrow')?.textContent?.trim()).toBe('🎲 main');
    expect(root.querySelector('a')?.getAttribute('href')).toBe(
      `/recipes/${shakshuka.id}`,
    );
  });

  it('keeps the chosen course when asked again', async () => {
    const { fixture, randomAdapterFake } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Mains');
    await fixture.whenStable();
    /* Picking the last recipe would surface the dessert if the course were lost. */
    randomAdapterFake.setPickIndex(-1);
    buttonByText(fixture.nativeElement, 'Surprise me again').click();
    await fixture.whenStable();

    expect(recipeName(fixture.nativeElement)).toBe('Shakshuka');
  });

  it('shows a message when the chosen course has no recipes', async () => {
    const { fixture } = mountSurpriseMe();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Starters');
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('Nothing to surprise you with');
  });
});

function mountSurpriseMe({
  recipes = [shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideRandomAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const randomAdapterFake = TestBed.inject(RandomAdapterFake);

  const fixture = TestBed.createComponent(SurpriseMe);

  return { fixture, randomAdapterFake };
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
