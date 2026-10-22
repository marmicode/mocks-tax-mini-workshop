import type { Weekday } from '@whiskmate/shared/model';

export const mealPlanRouterHelper = {
  PATH: 'meal-plan' as const,

  mealPlan() {
    return ['/', this.PATH];
  },

  autoFill() {
    return ['/', this.PATH, 'auto-fill'];
  },

  swap(weekday: Weekday) {
    return ['/', this.PATH, weekday, 'swap'];
  },

  share() {
    return ['/', this.PATH, 'share'];
  },
};
