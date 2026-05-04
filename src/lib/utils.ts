/**
 * Utility function to merge classNames using clsx
 */
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
