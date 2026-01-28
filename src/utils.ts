import fs from 'fs-extra';
import path from 'path';
import { BifrostConfig, PluginRegistry } from './types';

export async function getProjectConfig(): Promise<BifrostConfig | null> {
  const configPath = path.join(process.cwd(), 'config.bifrost');
  
  if (!await fs.pathExists(configPath)) {
    return null;
  }
  
  return await fs.readJson(configPath);
}

export async function getRegistry(): Promise<PluginRegistry> {
  const registryPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'registry.bifrost');
  return await fs.readJson(registryPath);
}

export function validatePlatformCompatibility(projectPlatform: string, pluginPlatform: string): boolean {
  return projectPlatform === pluginPlatform;
}