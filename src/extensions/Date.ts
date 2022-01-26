import moment, { unitOfTime } from 'moment';

export {};

declare global {
  interface Date {
    add(duration: number, unit: unitOfTime.DurationConstructor): Date;
    addDays(days: number): Date;
    addMonths(months: number): Date;
    addYears(years: number): Date;
    addHours(hours: number): Date;
    addMinutes(minutes: number): Date;
    subtract(duration: number, unit: unitOfTime.DurationConstructor): Date;
    subtractDays(days: number): Date;
    subtractMonths(months: number): Date;
    subtractYears(years: number): Date;
    subtractHours(hours: number): Date;
    subtractMinutes(minutes: number): Date;
    isSame(date: Date, unit?: unitOfTime.StartOf): boolean;
    isSameDay(date: Date): boolean;
    isBefore(date: Date): boolean;
    isAfter(date: Date): boolean;
    isBeforeNow(): boolean;
    isAfterNow(): boolean;
    format(format?: string): string;
  }
}

Date.prototype.add = function (duration, unit) {
  return moment(this).add(duration, unit).toDate();
};

Date.prototype.addDays = function (days) {
  return moment(this).add(days, 'days').toDate();
};

Date.prototype.addMonths = function (months) {
  return moment(this).add(months, 'months').toDate();
};

Date.prototype.addYears = function (years) {
  return moment(this).add(years, 'years').toDate();
};

Date.prototype.addHours = function (hours) {
  return moment(this).add(hours, 'hours').toDate();
};

Date.prototype.addMinutes = function (minutes) {
  return moment(this).add(minutes, 'minutes').toDate();
};

Date.prototype.subtract = function (duration, unit) {
  return moment(this).subtract(duration, unit).toDate();
};

Date.prototype.subtractDays = function (days) {
  return moment(this).subtract(days, 'days').toDate();
};

Date.prototype.subtractMonths = function (months) {
  return moment(this).subtract(months, 'months').toDate();
};

Date.prototype.subtractYears = function (years) {
  return moment(this).subtract(years, 'years').toDate();
};

Date.prototype.subtractHours = function (hours) {
  return moment(this).subtract(hours, 'hours').toDate();
};

Date.prototype.subtractMinutes = function (minutes) {
  return moment(this).subtract(minutes, 'hours').toDate();
};

Date.prototype.isSame = function (date, unit) {
  return moment(this).isSame(date, unit || 'day');
};

Date.prototype.isSame = function (date) {
  return moment(this).isSame(date);
};

Date.prototype.isBefore = function (date) {
  return moment(this).isBefore(date);
};

Date.prototype.isBeforeNow = function () {
  return moment(this).isBefore(moment());
};

Date.prototype.isAfterNow = function () {
  return moment(this).isAfter(moment());
};

Date.prototype.format = function (displayFormat = 'llll') {
  return moment(this).format(displayFormat);
};
