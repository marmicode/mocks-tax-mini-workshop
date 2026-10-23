import { describe, it } from 'vitest';
import { createRecipeSearchParams } from './recipe-repository';

describe(createRecipeSearchParams.name, () => {
  it('creates search params with defaults', () => {
    expect(createRecipeSearchParams()).toEqual({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('overrides defaults', () => {
    expect(createRecipeSearchParams({ maxStepCount: 3 })).toEqual({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 3,
    });
  });
});
