"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";

export function ResumeDropzone(props: {
  value?: File | null;
  onChange: (file: File | null) => void;
}) {
  const { value, onChange } = props;

  const onDrop = React.useCallback(
    (accepted: File[]) => {
      const f = accepted?.[0] ?? null;
      onChange(f);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    multiple: false,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const rejection = fileRejections?.[0];

  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx(
          "rounded-2xl border border-dashed p-6 text-center transition",
          isDragActive ? "border-black bg-neutral-50" : "border-neutral-300 bg-white"
        )}
      >
        <input {...getInputProps()} />
        <div className="text-sm font-medium">
          {value ? value.name : "Drag & drop your resume here"}
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          PDF / DOCX, up to 10MB
        </div>
        <div className="mt-3 text-xs text-neutral-600">
          Click to browse files
        </div>
      </div>

      {rejection ? (
        <div className="mt-2 text-sm text-red-600">
          {rejection.errors?.[0]?.message ?? "File not accepted"}
        </div>
      ) : null}
    </div>
  );
}
