'use client';

interface AutoSubmitProps {
  children: React.ReactNode;
}

export function AutoSubmit({ children }: AutoSubmitProps) {
  return (
    <div onChange={(e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      if (target.form) {
        target.form.submit();
      }
    }}>
      {children}
    </div>
  );
}
