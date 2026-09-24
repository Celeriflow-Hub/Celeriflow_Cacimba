"use client";

import React, { useState } from "react";

export interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maskType: "cnpj" | "cpf" | "phone" | "cep";
  type?: string;
}

export function MaskedInput({ maskType, onChange, defaultValue, ...props }: MaskedInputProps) {
  const [value, setValue] = useState(defaultValue || "");

  const applyMask = (val: string, type: string) => {
    let clean = val;
    if (type === "cnpj") {
      // Alphanumeric CNPJ: XX.XXX.XXX/XXXX-XX
      clean = clean.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (clean.length > 14) clean = clean.substring(0, 14);
      
      let masked = clean;
      if (clean.length > 2) masked = clean.substring(0, 2) + "." + clean.substring(2);
      if (clean.length > 5) masked = masked.substring(0, 6) + "." + clean.substring(5);
      if (clean.length > 8) masked = masked.substring(0, 10) + "/" + clean.substring(8);
      if (clean.length > 12) masked = masked.substring(0, 15) + "-" + clean.substring(12);
      return masked;
    }
    if (type === "cpf") {
      clean = clean.replace(/\D/g, "");
      if (clean.length > 11) clean = clean.substring(0, 11);
      
      let masked = clean;
      if (clean.length > 3) masked = clean.substring(0, 3) + "." + clean.substring(3);
      if (clean.length > 6) masked = masked.substring(0, 7) + "." + clean.substring(6);
      if (clean.length > 9) masked = masked.substring(0, 11) + "-" + clean.substring(9);
      return masked;
    }
    if (type === "phone") {
      clean = clean.replace(/\D/g, "");
      if (clean.length > 11) clean = clean.substring(0, 11);
      
      if (clean.length <= 10) {
        // (XX) XXXX-XXXX
        let masked = clean;
        if (clean.length > 0) masked = "(" + clean;
        if (clean.length > 2) masked = "(" + clean.substring(0, 2) + ") " + clean.substring(2);
        if (clean.length > 6) masked = "(" + clean.substring(0, 2) + ") " + clean.substring(2, 6) + "-" + clean.substring(6);
        return masked;
      } else {
        // (XX) XXXXX-XXXX
        const masked = "(" + clean.substring(0, 2) + ") " + clean.substring(2, 7) + "-" + clean.substring(7);
        return masked;
      }
    }
    if (type === "cep") {
      clean = clean.replace(/\D/g, "");
      if (clean.length > 8) clean = clean.substring(0, 8);
      
      let masked = clean;
      if (clean.length > 5) masked = clean.substring(0, 5) + "-" + clean.substring(5);
      return masked;
    }
    return clean;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, maskType);
    setValue(masked);
    e.target.value = masked;
    if (onChange) onChange(e);
  };

  // We can fallback to standard input styles if ui/input is not available, but let's assume it works.
  // Actually, we can just use standard HTML input if we don't want to break anything.
  return (
    <input 
      value={value}
      onChange={handleChange}
      {...props} 
    />
  );
}
