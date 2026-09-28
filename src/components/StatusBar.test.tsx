import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../components/StatusBar';

describe('StatusBar', () => {
  it('shows connected message when online', () => {
    render(<StatusBar gatewayStatus="online" />);
    expect(screen.getByText('Motor local conectado')).toBeInTheDocument();
  });

  it('shows disconnected message when offline', () => {
    render(<StatusBar gatewayStatus="offline" />);
    expect(screen.getByText('Motor local desconectado')).toBeInTheDocument();
  });

  it('shows checking message when checking', () => {
    render(<StatusBar gatewayStatus="checking" />);
    expect(screen.getByText('Verificando conexión...')).toBeInTheDocument();
  });

  it('shows model name', () => {
    render(<StatusBar gatewayStatus="online" />);
    expect(screen.getByText('Modelo: qwen3:4b')).toBeInTheDocument();
  });
});
