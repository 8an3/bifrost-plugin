// src/types.ts

export interface BifrostConfig {
  name: string;
  description: string;
  platform: string;
  github: string;
  tags: string[];
  postInstall?: string[];
  plugins?: string[];
}

export interface PluginConfig {
  name: string;
  description: string;
  platform: string;
  github: string;
  tags: string[];
  dependencies: string[];
  devDependencies: string[];
  files: PluginFile[];
  configs: ConfigEntry[];
}

export interface PluginFile {
  name: string;
  location: string;
}

export interface ConfigEntry {
  targetFile: string;
  configSource: string;
  insertType: 'append' | 'replace' | 'merge';
}

export interface RegistryPlugin {
  name: string;
  platform: string;
  github: string;
  description: string;
}

export type PluginRegistry = RegistryPlugin[];