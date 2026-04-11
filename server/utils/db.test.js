import { describe, expect, it } from 'vitest';
import { cosineSimilarity, dotProduct, searchVectors, vectorNorm } from './db.js';

describe( 'Database & Vector Logic', () => {

  it( 'should calculate dot product correctly', () => {
    const v1 = [1, 2, 3];
    const v2 = [4, 5, 6];
    // (1*4) + (2*5) + (3*6) = 4 + 10 + 18 = 32
    expect( dotProduct( v1, v2 ) ).toBe( 32 );
  } );

  it( 'should handle empty or mismatching vectors in dot product', () => {
    expect( dotProduct( [1], [0] ) ).toBe( 0 );
    expect( dotProduct( null, [1] ) ).toBe( 0 );
  } );

  it( 'should calculate vector norm correctly', () => {
    expect( vectorNorm( [3, 4] ) ).toBe( 5 );
    expect( vectorNorm( [] ) ).toBe( 0 );
    expect( vectorNorm( null ) ).toBe( 0 );
  } );

  it( 'should calculate cosine similarity correctly', () => {
    expect( cosineSimilarity( [1, 0], [1, 0] ) ).toBeCloseTo( 1, 6 );
    expect( cosineSimilarity( [1, 0], [0, 1] ) ).toBeCloseTo( 0, 6 );
    expect( cosineSimilarity( [1, 0], [-1, 0] ) ).toBeCloseTo( -1, 6 );
  } );

  it( 'should return zero cosine similarity when one vector has zero norm', () => {
    expect( cosineSimilarity( [0, 0], [1, 2] ) ).toBe( 0 );
  } );

  it( 'should return top matching courses from searchVectors', () => {
    // We provide a dummy vector that should theoretically match something high content-wise
    const dummyQuery = Array( 1536 ).fill( 0.1 );
    const results = searchVectors( dummyQuery, 2 );

    expect( results ).toBeInstanceOf( Array );
    expect( results.length ).toBeLessThanOrEqual( 2 );

    if ( results.length > 0 ) {
      expect( results[0].metadata ).toHaveProperty( 'title' );
      expect( results[0] ).toHaveProperty( 'score' );
    }
  } );

  it( 'should maintain stable scores', () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    expect( cosineSimilarity( v1, v2 ) ).toBe( 1 );
  } );

  it( 'should return empty results for invalid query vectors', () => {
    expect( searchVectors( [], 2 ) ).toEqual( [] );
    expect( searchVectors( null, 2 ) ).toEqual( [] );
    expect( searchVectors( [1, 2], 0 ) ).toEqual( [] );
  } );

} );
