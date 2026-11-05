import { outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import type { Weekday } from '@whiskmate/shared/model';
import { WeekdayPicker } from './weekday-picker.ng';

describe(WeekdayPicker, () => {
  it('emits the confirmed weekday', async () => {
    const { select } = mountWeekdayPicker();

    await page.getByRole('button', { name: 'Friday' }).click();

    expect(select).toHaveBeenCalledExactlyOnceWith('friday');
  });

  it('does not emit when dismissed', async () => {
    const { select } = mountWeekdayPicker();

    await page.getByRole('button', { name: 'Dismiss' }).click();

    expect(select).not.toHaveBeenCalled();
  });
});

function mountWeekdayPicker() {
  const select = vi.fn<(weekday: Weekday) => void>();

  TestBed.createComponent(WeekdayPicker, {
    bindings: [outputBinding('select', select)],
  });

  return { select };
}
