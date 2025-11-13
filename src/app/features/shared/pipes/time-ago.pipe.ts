import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value?: string | number | Date): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    const diff = (Date.now() - date.getTime()) / 1000;

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const ranges: [number, Intl.RelativeTimeFormatUnit][] = [
      [60, 'second'],
      [60, 'minute'],
      [24, 'hour'],
      [7,  'day'],
      [4.34524, 'week'],
      [12, 'month'],
      [Number.POSITIVE_INFINITY, 'year']
    ];

    let duration = diff;
    let unit: Intl.RelativeTimeFormatUnit = 'second';

    for (const [amount, nextUnit] of ranges) {
      if (Math.abs(duration) < amount) break;
      duration /= amount;
      unit = nextUnit;
    }

    const rounded = Math.round(-duration); // pasado → negativo para rtf
    return rtf.format(rounded, unit);
  }
}
