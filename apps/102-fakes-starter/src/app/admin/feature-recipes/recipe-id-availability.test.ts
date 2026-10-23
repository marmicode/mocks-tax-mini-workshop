import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeIdAvailability } from './recipe-id-availability';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeIdAvailability.name, () => {
  it('reports an unknown id as available', async () => {
    const { availability } = setUpRecipeIdAvailability();

    const available = await firstValueFrom(availability.isAvailable('falafel'));

    expect(available).toBe(true);
  });

  it('reports an existing id as taken', async () => {
    const { availability } = setUpRecipeIdAvailability();

    const available = await firstValueFrom(
      availability.isAvailable('shakshuka'),
    );

    expect(available).toBe(false);
  });

  it('trims the id before looking it up', async () => {
    const { availability } = setUpRecipeIdAvailability();

    const available = await firstValueFrom(
      availability.isAvailable('  shakshuka  '),
    );

    expect(available).toBe(false);
  });

  it('does not look up an empty id', async () => {
    const { availability } = setUpRecipeIdAvailability();

    const available = await firstValueFrom(availability.isAvailable('  '));

    expect(available).toBe(true);
  });
});

function setUpRecipeIdAvailability() {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka]);
  const availability = TestBed.inject(RecipeIdAvailability);
  return { availability };
}
