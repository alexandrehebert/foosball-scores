import { toZonedTime } from "date-fns-tz";

export const epochToDate = (epoch: number): Date => {
  return toZonedTime(epoch, "America/Montreal");
}