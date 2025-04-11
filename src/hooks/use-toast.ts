
// Re-export from shadcn/ui toast component
import { useToast as useShadcnToast, toast as shadcnToast } from "@/components/ui/toast";

export const useToast = useShadcnToast;
export const toast = shadcnToast;

export type { ToastProps, ToastActionElement } from "@/components/ui/toast";
