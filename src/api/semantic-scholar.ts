import type {
  SemanticAuthorSearchResponse,
  SemanticAuthorSearch,
  SemanticAuthorDetail
} from '../types/common-types';

/**
 * Searches for an author by name using the Semantic Scholar API.
 * @param query - The name of the author to search for.
 * @returns A promise that resolves to the search response containing author information.
 * @throws Error if the search request fails.
 */
export const searchAuthorByName = async (
  query: string
): Promise<SemanticAuthorSearchResponse> => {
  const baseURL = 'https://api.semanticscholar.org/graph/v1/author/search';
  const url = `${baseURL}?query=${encodeURIComponent(query)}`;
  const result = await fetch(url);
  if (!result.ok) {
    throw Error(`Search request failed with status: ${result.statusText}`);
  }

  const data = (await result.json()) as SemanticAuthorSearchResponse;
  return data;
};

/**
 * Retrieves details for multiple authors using the Semantic Scholar API.
 * @param authors - An array of author search results.
 * @returns A promise that resolves to an array of author details.
 * @throws Error if the fetch request fails.
 */
export const searchAuthorDetails = async (
  authors: SemanticAuthorSearch[]
): Promise<SemanticAuthorDetail[]> => {
  // Prepare for the fetch
  const authorIDs = authors.map(d => d.authorId);
  const body = {
    ids: authorIDs
  };

  const baseURL = 'https://api.semanticscholar.org/graph/v1/author/batch';
  const parameters: Record<string, string> = {
    fields: 'authorId,name,affiliations,homepage,paperCount,citationCount'
  };
  const encodedParameters = new URLSearchParams(parameters);

  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };

  const url = `${baseURL}?${encodedParameters.toString()}`;

  // Fetch the author details
  const response = await fetch(url, options);
  if (!response.ok) {
    throw Error(
      `Fetch error when getting author details, status: ${response.status}`
    );
  }

  const data = (await response.json()) as SemanticAuthorDetail[];
  return data;
};