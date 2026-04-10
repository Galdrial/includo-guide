import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';
import axios from 'axios';

// Mock axios to prevent network errors during UI tests
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: { history: [] } }),
      post: vi.fn().mockResolvedValue({ data: { success: true } }),
    }
  };
});

describe('IncluDO Frontend Integration', () => {

  it('renders the brand title correctly', () => {
    render(<App />);
    const titleElement = screen.getByText(/Inclu/i);
    expect(titleElement).toBeInTheDocument();
    expect(screen.getByText('DO')).toBeInTheDocument();
  });

  it('displays the welcome message with categories', async () => {
    render(<App />);
    // We use findByText because the message is added in an useEffect
    const welcome = await screen.findByText(/Le nostre aree di eccellenza sono/i);
    expect(welcome).toBeInTheDocument();
    
    const categories = await screen.findByText(/Legno, Tessuti, Ceramica, Pelle e Natura/i);
    expect(categories).toBeInTheDocument();
  });

  it('has correct ARIA roles for accessibility', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('input field is present and accessible', async () => {
    render(<App />);
    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();
  });

});
