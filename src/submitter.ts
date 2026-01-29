// src/submitter.ts

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { execSync } from 'child_process';

interface PluginConfig {
  name: string;
  description: string;
  platform: string;
  github: string;
  tags: string[];
  libraries: string[];
  files: Array<{
    name: string;
    location: string;
  }>;
  configs: any[];
}

interface RegistryEntry {
  name: string;
  description: string;
  platform: string;
  github: string;
  tags: string[];
}

const REGISTRY_REPO = 'A5GARD/BIFROST-PLUGIN';
const REGISTRY_FILE = 'dist/registry.bifrost';

export async function submitPlugin(): Promise<void> {
  console.log(chalk.blue.bold('\n📤 Submit Plugin to Registry\n'));
  
  const pluginConfigPath = path.join(process.cwd(), 'plugin.bifrost');
  
  if (!await fs.pathExists(pluginConfigPath)) {
    console.error(chalk.red('Error: plugin.bifrost not found in current directory'));
    console.log(chalk.yellow('Make sure you are in your plugin directory'));
    process.exit(1);
  }
  
  const pluginConfig: PluginConfig = await fs.readJson(pluginConfigPath);
  
  console.log(chalk.cyan('\nPlugin Information:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Name: ${chalk.white(pluginConfig.name)}`);
  console.log(`Description: ${chalk.white(pluginConfig.description)}`);
  console.log(`Platform: ${chalk.white(pluginConfig.platform)}`);
  console.log(`GitHub: ${chalk.white(pluginConfig.github)}`);
  console.log(`Tags: ${chalk.white(pluginConfig.tags.join(', '))}`);
  console.log(`Libraries: ${chalk.white(pluginConfig.libraries.join(', '))}`);
  console.log(chalk.gray('─'.repeat(50)));
  
  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Submit this plugin to the registry?',
    initial: true
  });
  
  if (!confirm) {
    console.log(chalk.yellow('\nSubmission cancelled'));
    process.exit(0);
  }
  
  try {
    const registryEntry: RegistryEntry = {
      name: pluginConfig.name,
      description: pluginConfig.description,
      platform: pluginConfig.platform,
      github: pluginConfig.github,
      tags: pluginConfig.tags
    };
    
    console.log(chalk.blue('\n🔄 Forking registry repository...'));
    execSync(`gh repo fork ${REGISTRY_REPO} --clone=false`, { stdio: 'inherit' });
    
    const username = execSync('gh api user -q .login', { encoding: 'utf-8' }).trim();
    const forkRepo = `${username}/bifrost-plugin`;
    
    console.log(chalk.blue('📥 Cloning forked repository...'));
    const tempDir = path.join(process.cwd(), '.bifrost-temp');
    await fs.ensureDir(tempDir);
    
    execSync(`gh repo clone ${forkRepo} ${tempDir}`, { stdio: 'inherit' });
    
    console.log(chalk.blue('📋 Fetching current registry...'));
    const registryUrl = `https://raw.githubusercontent.com/${REGISTRY_REPO}/main/${REGISTRY_FILE}`;
    const registryResponse = await fetch(registryUrl);
    
    let registry: RegistryEntry[] = [];
    
    if (registryResponse.ok) {
      registry = await registryResponse.json();
    }
    
    const registryPath = path.join(tempDir, REGISTRY_FILE);
    await fs.ensureDir(path.dirname(registryPath));
    
    const existingIndex = registry.findIndex(p => p.name === pluginConfig.name);
    
    if (existingIndex !== -1) {
      console.log(chalk.yellow('\n⚠ Plugin already exists in registry. Updating...'));
      registry[existingIndex] = registryEntry;
    } else {
      registry.push(registryEntry);
    }
    
    await fs.writeJson(registryPath, registry, { spaces: 2 });
    
    console.log(chalk.blue('💾 Committing changes...'));
    process.chdir(tempDir);
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Add/Update plugin: ${pluginConfig.name}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    
    console.log(chalk.blue('🔀 Creating pull request...'));
    const prUrl = execSync(
      `gh pr create --repo ${REGISTRY_REPO} --title "Add plugin: ${pluginConfig.name}" --body "Submitting plugin ${pluginConfig.name} to the registry.\n\nPlatform: ${pluginConfig.platform}\nDescription: ${pluginConfig.description}"`,
      { encoding: 'utf-8' }
    ).trim();
    
    process.chdir('..');
    await fs.remove(tempDir);
    
    console.log(chalk.green.bold('\n✨ Plugin submitted successfully!\n'));
    console.log(chalk.cyan('Pull Request:'), chalk.white(prUrl));
    console.log(chalk.gray('\nYour plugin will be available once the PR is merged.'));
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('gh: command not found')) {
      console.log(chalk.red('\n❌ GitHub CLI (gh) is not installed'));
      console.log(chalk.yellow('\nManual submission steps:'));
      console.log(chalk.gray(`1. Fork the repository: https://github.com/${REGISTRY_REPO}`));
      console.log(chalk.gray(`2. Clone your fork`));
      console.log(chalk.gray(`3. Add your plugin to ${REGISTRY_FILE}`));
      console.log(chalk.gray(`4. Commit and push changes`));
      console.log(chalk.gray(`5. Create a pull request`));
    } else {
      throw error;
    }
  }
}