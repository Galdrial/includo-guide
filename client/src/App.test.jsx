import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
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

  it( 'sends a message and renders assistant reply', async () => {
    await renderApp();

    axios.post.mockResolvedValueOnce( { data: { reply: 'Risposta orientamento test' } } );

    const input = screen.getByRole( 'textbox' );
    fireEvent.change( input, { target: { value: 'Vorrei un corso da remoto' } } );
    fireEvent.click( screen.getByRole( 'button', { name: /Invia messaggio/i } ) );

    await waitFor( () => {
      expect( screen.getByText( 'Risposta orientamento test' ) ).toBeInTheDocument();
    } );
  } );

  it( 'shows fallback error message when chat request fails', async () => {
    await renderApp();

    axios.post.mockRejectedValueOnce( new Error( 'network down' ) );

    const input = screen.getByRole( 'textbox' );
    fireEvent.change( input, { target: { value: 'Messaggio che fallisce' } } );
    fireEvent.click( screen.getByRole( 'button', { name: /Invia messaggio/i } ) );

    await waitFor( () => {
      expect( screen.getByText( /Errore di connessione. Riprova!/i ) ).toBeInTheDocument();
    } );
  } );

} );
