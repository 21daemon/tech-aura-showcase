
"use client"

import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast as useToastOriginal } from "@/components/ui/use-toast"

export { ToastProvider, ToastViewport }
export { Toast, ToastClose, ToastDescription, ToastTitle }
export type { ToastProps } from "@/components/ui/toast"

export const useToast = useToastOriginal;

export type ToasterToast = ReturnType<typeof useToast>["toast"]

export const toast = useToastOriginal().toast;
