import type {
  SemanticAuthorSearchResponse,
  SemanticAuthorSearch,
  SemanticAuthorDetail,
  SemanticPaperSearchResponse,
  SemanticPaper,
  SemanticPaperCitationDetail
} from '../types/common-types';
import { downloadJSON } from '@xiaohk/utils';

import paperSearchMockJSON from '../../test/api-responses/paper-search.json';
import citationSearchMockJSON from '../../test/api-responses/citation-search.json';
import authorCitationSearchMockJSON0 from '../../test/api-responses/author-citation-search-8-0.json';
import authorCitationSearchMockJSON1 from '../../test/api-responses/author-citation-search-8-1.json';
import authorCitationSearchMockJSON2 from '../../test/api-responses/author-citation-search-8-2.json';
import authorCitationSearchMockJSON3 from '../../test/api-responses/author-citation-search-8-3.json';
import authorCitationSearchMockJSON4 from '../../test/api-responses/author-citation-search-8-4.json';
import authorCitationSearchMockJSON5 from '../../test/api-responses/author-citation-search-8-5.json';
import authorCitationSearchMockJSON6 from '../../test/api-responses/author-citation-search-8-6.json';
import authorCitationSearchMockJSON7 from '../../test/api-responses/author-citation-search-8-7.json';
import authorCitationSearchMockJSON8 from '../../test/api-responses/author-citation-search-8-8.json';

const MOCK_HTTP_CALL = false;

const paperSearchMock = paperSearchMockJSON as SemanticPaperSearchResponse;
const citationSearchMock =
  citationSearchMockJSON as SemanticPaperCitationDetail[];

let authorCitationMockCounter = 0;
const authorCitationSearchMocks = [
  authorCitationSearchMockJSON0 as SemanticAuthorDetail[],
  authorCitationSearchMockJSON1 as SemanticAuthorDetail[],
  authorCitationSearchMockJSON2 as SemanticAuthorDetail[],
  authorCitationSearchMockJSON3 as SemanticAuthorDetail[],
  authorCitationSearchMockJSON4 as SemanticAuthorDetail[],
  authorCitationSearchMockJSON5 as SemanticAuthorDetail[],
  authorCitationSearchMockJSON6 as SemanticAuthorDetail[],
  authorCitationSearchMockJSON7 as SemanticAuthorDetail[],
  authorCitationSearchMockJSON8 as SemanticAuthorDetail[]
];

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
 * @param authors - An array of author IDs.
 * @returns A promise that resolves to an array of author details.
 * @throws Error if the fetch request fails.
 */
export const searchAuthorDetails = async (
  authorIDs: string[],
  fields?: string
): Promise<SemanticAuthorDetail[]> => {
  if (fields !== undefined && MOCK_HTTP_CALL) {
    const result = authorCitationSearchMocks[authorCitationMockCounter];
    authorCitationMockCounter =
      (authorCitationMockCounter + 1) % authorCitationSearchMocks.length;
    return result;
  }

  // Prepare for the fetch
  const body = {
    ids: authorIDs
  };

  const baseURL = 'https://api.semanticscholar.org/graph/v1/author/batch';

  const curFields =
    fields || 'authorId,name,affiliations,homepage,paperCount,citationCount';
  const parameters: Record<string, string> = {
    fields: curFields
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
    console.error('API error', response);
    throw new Error(
      `Fetch error when getting author details, status: ${response.status}`
    );
  }

  const data = (await response.json()) as SemanticAuthorDetail[];

  // downloadJSON(data, null, 'author.json');

  return data;
};

export const getAllPapersFromAuthor = async (authorID: string) => {
  if (MOCK_HTTP_CALL) {
    return paperSearchMock.data;
  }

  // Prepare for the fetch
  const baseURL = `https://api.semanticscholar.org/graph/v1/author/${authorID}/papers`;
  let offset = 0;
  let isComplete = false;
  const papers: SemanticPaper[] = [];

  while (!isComplete) {
    const parameters: Record<string, string> = {
      fields:
        'corpusId,url,title,venue,publicationVenue,year,authors,externalIds,citationCount,publicationDate',
      offset: String(offset)
    };
    const encodedParameters = new URLSearchParams(parameters);
    const url = `${baseURL}?${encodedParameters.toString()}`;

    // Fetch the paper details
    const response = await fetch(url);
    if (!response.ok) {
      throw Error(
        `Fetch error when getting paper details, status: ${response.status}`
      );
    }

    const data = (await response.json()) as SemanticPaperSearchResponse;

    // Append the paper data
    data.data.forEach(d => {
      papers.push(d);
    });

    // Keep fetching until retrieving all the papers
    if (data.next !== undefined) {
      offset = data.next;
    } else {
      isComplete = true;
    }
  }

  return papers;
};

export const getPaperCitations = async (paperIDs: string[]) => {
  if (MOCK_HTTP_CALL) {
    return citationSearchMock;
  }

  // Prepare for the fetch
  const body = {
    ids: paperIDs
  };

  const baseURL = 'https://api.semanticscholar.org/graph/v1/paper/batch';
  const parameters: Record<string, string> = {
    fields: 'paperId,citations.authors'
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

  const data = (await response.json()) as SemanticPaperCitationDetail[];
  return data;
};
