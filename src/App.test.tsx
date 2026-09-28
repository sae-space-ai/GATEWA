import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Ollama Chat')).toBeInTheDocument();
  });

  it('shows model selector', () => {
    render(<App />);
    expect(screen.getByText('qwen3:4b')).toBeInTheDocument();
  });

  it('shows new conversation button', () => {
    render(<App />);
    expect(screen.getByText('Nueva conversación')).toBeInTheDocument();
  });

  it('shows welcome message when no conversation is active', () => {
    render(<App />);
    // The welcome text depends on gateway status, but one of these should be present
    const welcomeTexts = ['¿En qué puedo ayudarte?', 'Motor local no disponible'];
    const hasWelcome = welcomeTexts.some(text => 
      screen.queryByText(text) !== null
    );
    expect(hasWelcome).toBe(true);
  });
});
