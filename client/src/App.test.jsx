import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

const renderApp = async () => {
  render( <App /> );
  await screen.findByText( /Le nostre aree di eccellenza sono/i );
};

// Mock axios to prevent network errors during UI tests
vi.mock( 'axios', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue( { data: { history: [] } } ),
      post: vi.fn().mockResolvedValue( { data: { success: true } } ),
    }
  };
} );

// Mock localStorage
Object.defineProperty( window, 'localStorage', {
  value: {
    getItem: vi.fn().mockReturnValue( null ),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true
} );

describe( 'IncluDO Frontend Integration', () => {

  it( 'renders the brand title correctly', async () => {
    await renderApp();
    const titleElement = screen.getByRole( 'heading', { name: /IncluDO Guide/i } );
    expect( titleElement ).toBeInTheDocument();
    expect( screen.getByText( 'DO' ) ).toBeInTheDocument();
  } );

  it( 'displays the welcome message with categories', async () => {
    await renderApp();
    const welcome = screen.getByText( /Le nostre aree di eccellenza sono/i );
    expect( welcome ).toBeInTheDocument();

    const categories = screen.getByText( /Legno, Tessuti, Ceramica, Pelle e Natura/i );
    expect( categories ).toBeInTheDocument();
  } );

  it( 'has correct ARIA roles for accessibility', async () => {
    await renderApp();
    expect( screen.getByRole( 'banner' ) ).toBeInTheDocument();
    expect( screen.getByRole( 'log' ) ).toBeInTheDocument();
  } );

  it( 'input field is present and accessible', async () => {
    await renderApp();
    const input = screen.getByRole( 'textbox' );
    expect( input ).toBeInTheDocument();
  } );

} );
