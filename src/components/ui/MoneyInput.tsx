"use client"

import type { ChangeEvent, InputHTMLAttributes } from "react"
import { Input } from "@/components/ui/input"

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

export function MoneyInput({ value, onChange, ...props }: MoneyInputProps) {
  // Convert number to formatted string: e.g. 1234.56 -> "1.234,56"
  const formatMoney = (val: number) => {
    if (isNaN(val)) return ""
    return new Intl.NumberFormat('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value

    // Remove all non-digits
    rawValue = rawValue.replace(/\D/g, "")
    
    if (!rawValue) {
      onChange(0)
      return
    }

    // Convert to number assuming last 2 digits are decimals
    const numericValue = parseInt(rawValue, 10) / 100
    
    onChange(numericValue)
  }

  return (
    <>
      <input type="hidden" name={props.name} value={value} />
      <Input
        {...props}
        name={undefined}
        type="text"
      value={formatMoney(value)}
      onChange={handleChange}
    />
    </>
  )
}
