
// Re-export from our custom hook implementation
import { useToast, toast, ToastProvider, ToastViewport, Toast, ToastClose, ToastDescription, ToastTitle } from "@/hooks/use-toast";

export { 
  useToast, 
  toast, 
  ToastProvider, 
  ToastViewport,
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle
};

export type { ToasterToast } from "@/hooks/use-toast";
