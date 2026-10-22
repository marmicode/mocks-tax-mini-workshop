import type { Route } from '@angular/router';
import { MealPlanAutoFill } from './meal-plan-auto-fill.ng';
import { MealPlanShare } from './meal-plan-share.ng';
import { MealPlanSwap } from './meal-plan-swap.ng';
import { MealPlan } from './meal-plan.ng';
import { mealPlanRouterHelper } from './meal-plan.router-helper';

export const mealPlanRoutes: Route[] = [
  {
    path: mealPlanRouterHelper.PATH,
    component: MealPlan,
  },
  {
    path: `${mealPlanRouterHelper.PATH}/auto-fill`,
    component: MealPlanAutoFill,
  },
  {
    path: `${mealPlanRouterHelper.PATH}/share`,
    component: MealPlanShare,
  },
  {
    path: `${mealPlanRouterHelper.PATH}/:weekday/swap`,
    component: MealPlanSwap,
  },
];
