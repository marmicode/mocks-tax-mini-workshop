import type { Route } from '@angular/router';
import { AdminCourseBoard } from './admin-course-board.ng';
import { AdminDuplicates } from './admin-duplicates.ng';
import { AdminExport } from './admin-export.ng';
import { AdminImport } from './admin-import.ng';
import { AdminIngredients } from './admin-ingredients.ng';
import { AdminQualityReport } from './admin-quality-report.ng';
import { AdminMissingDescriptions } from './admin-missing-descriptions.ng';
import { AdminMissingSteps } from './admin-missing-steps.ng';
import { AdminMissingIngredients } from './admin-missing-ingredients.ng';
import { AdminStepHistogram } from './admin-step-histogram.ng';
import { AdminIngredientHistogram } from './admin-ingredient-histogram.ng';
import { AdminIdAudit } from './admin-id-audit.ng';
import { AdminLongNames } from './admin-long-names.ng';
import { AdminPictureAudit } from './admin-picture-audit.ng';

/**
 * Relative to the admin route.
 */
export const adminCatalogRoutes: Route[] = [
  { path: 'catalog/duplicates', component: AdminDuplicates },
  { path: 'catalog/quality', component: AdminQualityReport },
  { path: 'catalog/courses', component: AdminCourseBoard },
  { path: 'catalog/ingredients', component: AdminIngredients },
  { path: 'catalog/export', component: AdminExport },
  { path: 'catalog/import', component: AdminImport },
  { path: 'catalog/missing-descriptions', component: AdminMissingDescriptions },
  { path: 'catalog/missing-steps', component: AdminMissingSteps },
  { path: 'catalog/missing-ingredients', component: AdminMissingIngredients },
  { path: 'catalog/step-histogram', component: AdminStepHistogram },
  { path: 'catalog/ingredient-histogram', component: AdminIngredientHistogram },
  { path: 'catalog/id-audit', component: AdminIdAudit },
  { path: 'catalog/long-names', component: AdminLongNames },
  { path: 'catalog/picture-audit', component: AdminPictureAudit },
];
