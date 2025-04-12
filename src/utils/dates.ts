import { format, parse } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const epochToDate = (epoch: number): Date => {
  return toZonedTime(epoch, "America/Montreal");
}

export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy');
}

export const formatDay = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
}

export const parseDay = (day: string): Date => {
  return parse(day, 'yyyy-MM-dd', new Date())
}
