/**
 * GreenOps AI - Phase 14: GitHub PR Integration Types
 *
 * Defines GitHub webhook payloads, PR context DTOs, diff parsing structures,
 * and sustainability report generation interfaces.
 */

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url?: string;
  };
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  diff_url: string;
  patch_url: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  head: {
    sha: string;
    ref: string;
    repo: GitHubRepository;
  };
  base: {
    sha: string;
    ref: string;
    repo: GitHubRepository;
  };
}

export interface GitHubWebhookPayload {
  action?: "opened" | "synchronize" | "reopened" | "closed" | "labeled" | "unlabeled" | string;
  number?: number;
  pull_request?: GitHubPullRequest;
  repository?: GitHubRepository;
  sender?: {
    login: string;
    id: number;
  };
  zen?: string;
  hook_id?: number;
}

export interface PullRequestContext {
  owner: string;
  repo: string;
  pullNumber: number;
  prTitle: string;
  prUrl: string;
  headSha: string;
  baseSha: string;
  action: string;
  deliveryId?: string;
}

export interface ExtractedPRFile {
  fileName: string;
  language: string;
  code: string;
  patch?: string;
  status?: "added" | "modified" | "removed" | "renamed";
}

export interface GitHubCommentResult {
  commentId?: number | string;
  htmlUrl?: string;
  posted: boolean;
  mocked?: boolean;
  error?: string;
}
