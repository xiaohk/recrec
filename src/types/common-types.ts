/**
 * Type definitions
 */

export interface SemanticCitationAuthor {
  authorId: string;
  name: string;
}

export interface SemanticCitation {
  paperId: string;
  authors: SemanticCitationAuthor[];
}

export interface SemanticPaperCitationDetail {
  paperId: string;
  citations: SemanticCitation[];
}

export interface SemanticPaperSearchResponse {
  offset: number;
  next?: number;
  data: SemanticPaper[];
}

export interface SemanticExternalIds {
  DBLP?: string;
  ArXiv?: string;
  DOI?: string;
  CorpusId: number;
}

export interface SemanticPublicationVenue {
  id: string;
  name: string;
  type: string;
  alternate_names: string[];
  url: string;
}

export interface SemanticAuthor {
  authorId: string;
  name: string;
}

export interface SemanticPaper {
  paperId: string;
  externalIds: SemanticExternalIds;
  corpusId: number;
  publicationVenue: SemanticPublicationVenue;
  url: string;
  title: string;
  venue: string;
  year: number;
  citationCount: number;
  publicationDate: string;
  authors: SemanticAuthor[];
}

export interface SemanticAuthorSearch {
  authorId: string;
  name: string;
}

export interface SemanticAuthorSearchResponse {
  total: number;
  offset: number;
  next: number;
  data: SemanticAuthorSearch[];
}

export type SemanticAuthorDetail = SemanticAuthorDetailContent | null;

export interface SemanticAuthorDetailContent {
  authorId: string;
  affiliations?: string[];
  citationCount?: number;
  homepage?: string;
  name?: string;
  paperCount?: number;
  hIndex?: number;
  url?: string;
}

export enum Step {
  Author = 'author',
  Paper = 'paper',
  Recommender = 'recommender'
}

export interface SimpleEventMessage {
  message: string;
}

export type Mutable<Type> = {
  -readonly [Key in keyof Type]: Type[Key];
};

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RectPoint {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PromptModel {
  task: string;
  prompt: string;
  variables: string[];
  temperature: number;
  stopSequences?: string[];
}

export type TextGenWorkerMessage =
  | {
      command: 'startTextGen';
      payload: {
        requestID: string;
        apiKey: string;
        prompt: string;
        temperature: number;
        stopSequences?: string[];
        detail?: string;
      };
    }
  | {
      command: 'finishTextGen';
      payload: {
        requestID: string;
        apiKey: string;
        result: string;
        prompt: string;
        detail: string;
      };
    }
  | {
      command: 'error';
      payload: {
        requestID: string;
        originalCommand: string;
        message: string;
      };
    };
