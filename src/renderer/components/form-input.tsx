"use client"

import { Input, type InputProps } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface FormInputProps extends InputProps {
  label?: string
  error?: string
  required?: boolean
  helperText?: string
}

export function FormInput({ label, error, required, helperText, ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Input {...props} className={`border-border/50 ${error ? "border-red-500" : ""}`} />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {helperText && !error && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  )
}
