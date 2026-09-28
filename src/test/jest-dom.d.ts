import '@testing-library/jest-dom';

declare global {
  namespace Vi {
    interface JestAssertion<T> {
      toBeInTheDocument(): void;
      toBeVisible(): void;
      toBeDisabled(): void;
      toHaveTextContent(text: string | RegExp): void;
    }
  }
}

export {};
