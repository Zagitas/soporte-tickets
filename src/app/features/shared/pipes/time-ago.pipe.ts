import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value?: string | number | Date): string {
    if (!value) return '';

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      // Soporta 'YYYY-MM-DD HH:mm' y 'YYYY-MM-DDTHH:mm'
      const normalized = value.replace('T', ' ');
      const [d, t] = normalized.split(' ');
      const [y, m, day] = d.split('-').map(Number);
      const [h, min] = t.split(':').map(Number);
      date = new Date(y, m - 1, day, h, min);
    } else {
      date = new Date(value);
    }

    if (isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

    const minute = 60;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diffSec < minute) {
      return rtf.format(-diffSec, 'second');
    }

    if (diffSec < hour) {
      return rtf.format(-Math.round(diffSec / minute), 'minute');
    }

    if (diffSec < day) {
      return rtf.format(-Math.round(diffSec / hour), 'hour');
    }

    if (diffSec < week) {
      return rtf.format(-Math.round(diffSec / day), 'day');
    }

    if (diffSec < month) {
      return rtf.format(-Math.round(diffSec / week), 'week');
    }

    if (diffSec < year) {
      return rtf.format(-Math.round(diffSec / month), 'month');
    }

    return rtf.format(-Math.round(diffSec / year), 'year');
  }


}
