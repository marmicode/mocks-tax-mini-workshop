import type { Course } from '@whiskmate/shared-recipe/model';

const COURSE_LABELS: Record<Course, string> = {
  starter: 'Starters',
  main: 'Mains',
  dessert: 'Desserts',
};

export function courseLabel(course: Course): string {
  return COURSE_LABELS[course];
}
