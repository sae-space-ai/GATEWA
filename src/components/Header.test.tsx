import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';

describe('Header', () => {
  it('renders the app title', () => {
    render(
      <Header 
        gatewayStatus="online" 
        isGenerating={false} 
        selectedModel="qwen3:4b"
        onToggleSidebar={() => {}} 
      />
    );
    expect(screen.getByText('Ollama Chat')).toBeInTheDocument();
  });

  it('shows LOCAL ONLINE when gateway is online', () => {
    render(
      <Header 
        gatewayStatus="online" 
        isGenerating={false} 
        selectedModel="qwen3:4b"
        onToggleSidebar={() => {}} 
      />
    );
    expect(screen.getByText('LOCAL ONLINE')).toBeInTheDocument();
  });

  it('shows LOCAL OFFLINE when gateway is offline', () => {
    render(
      <Header 
        gatewayStatus="offline" 
        isGenerating={false} 
        selectedModel="qwen3:4b"
        onToggleSidebar={() => {}} 
      />
    );
    expect(screen.getByText('LOCAL OFFLINE')).toBeInTheDocument();
  });

  it('shows generating indicator when isGenerating is true', () => {
    render(
      <Header 
        gatewayStatus="online" 
        isGenerating={true} 
        selectedModel="qwen3:4b"
        onToggleSidebar={() => {}} 
      />
    );
    expect(screen.getByText('Generando...')).toBeInTheDocument();
  });

  it('shows the selected model', () => {
    render(
      <Header 
        gatewayStatus="online" 
        isGenerating={false} 
        selectedModel="qwen3:4b"
        onToggleSidebar={() => {}} 
      />
    );
    expect(screen.getByText('qwen3:4b')).toBeInTheDocument();
  });
});
