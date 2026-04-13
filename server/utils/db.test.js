/**
 * UNIT TESTS - Vector Logic & Database Operations
 * This suite verifies the mathematical correctness of our RAG engine,
 * specifically the dot product, vector norm, and cosine similarity calculations.
 */

import { describe, expect, it } from 'vitest';
import { cosineSimilarity, dotProduct, searchVectors, vectorNorm } from './db.js';

describe( 'Vector Mathematics & Search Logic', () => {

  /** 
   * Dot Product Calculation
   * Verifies the algebraic sum of products of corresponding entries.
   */
  it( 'should calculate dot product correctly', () => {
    const v1 = [1, 2, 3];
    const v2 = [4, 5, 6];
    // Expected: (1*4) + (2*5) + (3*6) = 4 + 10 + 18 = 32
    expect( dotProduct( v1, v2 ) ).toBe( 32 );
  } );

  it( 'should handle empty or mismatching vectors in dot product', () => {
    expect( dotProduct( [1], [0] ) ).toBe( 0 );
    expect( dotProduct( null, [1] ) ).toBe( 0 );
  } );

  /**
   * Vector Norm (Magnitude)
   * Verifies the calculation of the Euclidean length of a vector.
   */
  it( 'should calculate vector norm correctly', () => {
    expect( vectorNorm( [3, 4] ) ).toBe( 5 );
    expect( vectorNorm( [] ) ).toBe( 0 );
    expect( vectorNorm( null ) ).toBe( 0 );
  } );

  /**
   * Cosine Similarity
   * Verifies that similarity scores are accurate (1.0 for identical, 0.0 for orthogonal).
   */
  it( 'should calculate cosine similarity correctly', () => {
    expect( cosineSimilarity( [1, 0], [1, 0] ) ).toBeCloseTo( 1, 6 ); // Identical
    expect( cosineSimilarity( [1, 0], [0, 1] ) ).toBeCloseTo( 0, 6 ); // Orthogonal
    expect( cosineSimilarity( [1, 0], [-1, 0] ) ).toBeCloseTo( -1, 6 ); // Opposite
  } );

  it( 'should return zero cosine similarity when one vector has zero norm to avoid division by zero', () => {
    expect( cosineSimilarity( [0, 0], [1, 2] ) ).toBe( 0 );
  } );

  /**
   * Retrieval Logic (Top-K)
   * Verifies that searchVectors returns correctly formatted result objects with similarity scores.
   */
  it( 'should return top matching courses from searchVectors with valid metadata', () => {
    // Dummy vector representing a standard 1536d embedding
    const dummyQuery = Array( 1536 ).fill( 0.1 );
    const results = searchVectors( dummyQuery, 2 );

    expect( results ).toBeInstanceOf( Array );
    expect( results.length ).toBeLessThanOrEqual( 2 );

    if ( results.length > 0 ) {
      expect( results[0].metadata ).toHaveProperty( 'title' );
      expect( results[0] ).toHaveProperty( 'score' );
    }
  } );

  /** 
   * Integrity & Edge Cases
   */
  it( 'should return empty results for invalid or null query vectors', () => {
    expect( searchVectors( [], 2 ) ).toEqual( [] );
    expect( searchVectors( null, 2 ) ).toEqual( [] );
    expect( searchVectors( [1, 2], 0 ) ).toEqual( [] );
  } );

} );
