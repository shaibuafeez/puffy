"use client";

import { useState, useCallback } from "react";
import type { FormDefinition, FormField, FormSettings, FieldType } from "@/lib/types";

const defaultSettings: FormSettings = {
  encryptSubmissions: true,
  allowAnonymous: true,
  submitMessage: "Thank you for your submission!",
};

function createField(type: FieldType): FormField {
  const id = crypto.randomUUID();
  const base: FormField = {
    id,
    type,
    label: "",
    required: false,
  };

  switch (type) {
    case "dropdown":
    case "checkbox":
    case "radio":
      return { ...base, options: ["Option 1", "Option 2"] };
    case "star-rating":
      return { ...base, maxRating: 5 };
    case "file-upload":
      return {
        ...base,
        acceptTypes: ["image/*", "video/*"],
        maxFileSize: 10 * 1024 * 1024,
      };
    case "confirm":
      return { ...base, required: true };
    default:
      return base;
  }
}

export function useFormBuilder(initialForm?: FormDefinition) {
  const [title, setTitle] = useState(initialForm?.title || "");
  const [description, setDescription] = useState(
    initialForm?.description || ""
  );
  const [fields, setFields] = useState<FormField[]>(
    initialForm?.fields || []
  );
  const [settings, setSettings] = useState<FormSettings>(
    initialForm?.settings || defaultSettings
  );

  const addField = useCallback((type: FieldType) => {
    const field = createField(type);
    setFields((prev) => [...prev, field]);
    return field.id;
  }, []);

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const removeField = useCallback((fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  }, []);

  const moveField = useCallback(
    (fieldId: string, direction: "up" | "down") => {
      setFields((prev) => {
        const index = prev.findIndex((f) => f.id === fieldId);
        if (index < 0) return prev;
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;
        const next = [...prev];
        [next[index], next[newIndex]] = [next[newIndex], next[index]];
        return next;
      });
    },
    []
  );

  const updateSettings = useCallback((updates: Partial<FormSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const loadGenerated = useCallback(
    (data: { title: string; description: string; fields: FormField[]; settings: Partial<FormSettings> }) => {
      setTitle(data.title);
      setDescription(data.description);
      // Ensure each field has a unique id
      setFields(
        data.fields.map((f) => ({
          ...f,
          id: f.id || crypto.randomUUID(),
        }))
      );
      setSettings((prev) => ({ ...prev, ...data.settings }));
    },
    []
  );

  const form: Omit<FormDefinition, "id" | "owner" | "createdAt"> = {
    title,
    description,
    fields,
    settings,
  };

  const isValid = title.trim().length > 0 && fields.length > 0;

  return {
    form,
    title,
    setTitle,
    description,
    setDescription,
    fields,
    settings,
    addField,
    updateField,
    removeField,
    moveField,
    updateSettings,
    loadGenerated,
    isValid,
  };
}
