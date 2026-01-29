// src/config-manager.ts
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { ConfigEntry } from './types';

export async function processConfigFiles(
  pluginGithub: string,
  configs: ConfigEntry[]
): Promise<void> {
  for (const config of configs) {
    const targetPath = path.join(process.cwd(), config.targetFile);
    const configUrl = `https://raw.githubusercontent.com/${pluginGithub}/main/files/${config.configSource}`;
    
    const configResponse = await fetch(configUrl);
    
    if (!configResponse.ok) {
      throw new Error(`Failed to fetch config file ${config.configSource}: ${configResponse.statusText}`);
    }
    
    const configContent = await configResponse.text();
    
    if (!await fs.pathExists(targetPath)) {
      console.log(chalk.yellow(`\nTarget file ${config.targetFile} does not exist. Skipping...`));
      continue;
    }
    
    const existingContent = await fs.readFile(targetPath, 'utf-8');
    
    if (await checkIfConfigExists(existingContent, configContent, config.targetFile)) {
      console.log(chalk.green(`\n✓ Configuration already exists in ${config.targetFile}. Skipping...`));
      continue;
    }
    
    console.log(chalk.cyan(`\n📝 Configuration needed for: ${config.targetFile}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(configContent);
    console.log(chalk.gray('─'.repeat(50)));
    
    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: `How would you like to handle ${config.targetFile}?`,
      choices: [
        { title: 'Auto-apply changes', value: 'auto' },
        { title: 'Copy to clipboard (manual)', value: 'manual' },
        { title: 'Skip this configuration', value: 'skip' }
      ]
    });
    
    if (action === 'skip') {
      console.log(chalk.yellow(`Skipped ${config.targetFile}`));
      continue;
    }
    
    if (action === 'manual') {
      console.log(chalk.blue(`\nPlease manually add the above configuration to ${config.targetFile}`));
      continue;
    }
    
    if (action === 'auto') {
      await applyConfig(targetPath, existingContent, configContent, config);
      console.log(chalk.green(`✓ Applied configuration to ${config.targetFile}`));
    }
  }
}

async function checkIfConfigExists(
  existingContent: string,
  newContent: string,
  targetFile: string
): Promise<boolean> {
  const extension = path.extname(targetFile);
  
  if (extension === '.json' || extension === '.jsonc') {
    return checkJsonConfigExists(existingContent, newContent);
  }
  
  if (extension === '.env') {
    return checkEnvConfigExists(existingContent, newContent);
  }
  
  const cleanNew = newContent.trim().replace(/\s+/g, ' ');
  const cleanExisting = existingContent.trim().replace(/\s+/g, ' ');
  
  return cleanExisting.includes(cleanNew);
}

function checkJsonConfigExists(existingContent: string, newContent: string): boolean {
  try {
    const existing = JSON.parse(existingContent);
    const newConfig = JSON.parse(newContent);
    
    return deepIncludes(existing, newConfig);
  } catch {
    return false;
  }
}

function checkEnvConfigExists(existingContent: string, newContent: string): boolean {
  const existingLines = existingContent.split('\n').map(line => line.trim());
  const newLines = newContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  
  for (const newLine of newLines) {
    const [key] = newLine.split('=');
    const exists = existingLines.some(line => line.startsWith(`${key}=`));
    if (!exists) {
      return false;
    }
  }
  
  return true;
}

function deepIncludes(existing: any, newConfig: any): boolean {
  if (typeof newConfig !== 'object' || newConfig === null) {
    return existing === newConfig;
  }
  
  for (const key in newConfig) {
    if (!(key in existing)) {
      return false;
    }
    
    if (typeof newConfig[key] === 'object' && newConfig[key] !== null) {
      if (!deepIncludes(existing[key], newConfig[key])) {
        return false;
      }
    } else if (Array.isArray(newConfig[key])) {
      if (!Array.isArray(existing[key])) {
        return false;
      }
      for (const item of newConfig[key]) {
        if (!existing[key].includes(item)) {
          return false;
        }
      }
    } else if (existing[key] !== newConfig[key]) {
      return false;
    }
  }
  
  return true;
}

async function applyConfig(
  targetPath: string,
  existingContent: string,
  newContent: string,
  config: ConfigEntry
): Promise<void> {
  const extension = path.extname(targetPath);
  
  if (extension === '.json' || extension === '.jsonc') {
    await applyJsonConfig(targetPath, existingContent, newContent);
    return;
  }
  
  if (extension === '.env') {
    await applyEnvConfig(targetPath, existingContent, newContent);
    return;
  }
  
  if (config.insertType === 'append') {
    const updatedContent = existingContent + '\n\n' + newContent;
    await fs.writeFile(targetPath, updatedContent, 'utf-8');
  } else if (config.insertType === 'replace') {
    await fs.writeFile(targetPath, newContent, 'utf-8');
  } else if (config.insertType === 'merge') {
    const updatedContent = existingContent + '\n\n' + newContent;
    await fs.writeFile(targetPath, updatedContent, 'utf-8');
  }
}

async function applyJsonConfig(
  targetPath: string,
  existingContent: string,
  newContent: string
): Promise<void> {
  const existing = JSON.parse(existingContent);
  const newConfig = JSON.parse(newContent);
  
  const merged = deepMerge(existing, newConfig);
  
  await fs.writeFile(targetPath, JSON.stringify(merged, null, 2), 'utf-8');
}

async function applyEnvConfig(
  targetPath: string,
  existingContent: string,
  newContent: string
): Promise<void> {
  const existingLines = existingContent.split('\n');
  const newLines = newContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  
  const existingKeys = new Set(
    existingLines
      .filter(line => line.includes('='))
      .map(line => line.split('=')[0].trim())
  );
  
  const linesToAdd = newLines.filter(line => {
    const key = line.split('=')[0].trim();
    return !existingKeys.has(key);
  });
  
  if (linesToAdd.length > 0) {
    const updatedContent = existingContent + '\n\n' + linesToAdd.join('\n');
    await fs.writeFile(targetPath, updatedContent, 'utf-8');
  }
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else if (Array.isArray(source[key])) {
      if (Array.isArray(target[key])) {
        output[key] = [...new Set([...target[key], ...source[key]])];
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
}