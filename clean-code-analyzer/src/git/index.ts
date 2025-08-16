/**
 * Git integration exports
 */

export * from './git-service';
export * from './commit-analyzer';
export * from './branch-comparator';
export * from './hook-installer';
export * from './pr-reporter';

// Re-export types
export type { HookConfig, PreCommitConfig, CommitMsgConfig, PrePushConfig } from './hook-installer';