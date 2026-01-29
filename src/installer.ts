// src/installer.ts

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import prompts from 'prompts';
import { PluginConfig } from './types';
import { processConfigFiles } from './config-manager';

export async function installPlugin(pluginGithub: string, projectPlatform: string): Promise<void> {
  const installedFiles: string[] = [];
  const installedLibraries: string[] = [];
  const modifiedConfigFiles: string[] = [];
  
  let spinner = ora('Fetching plugin configuration...').start();
  
  try {
    const configUrl = `https://raw.githubusercontent.com/${pluginGithub}/main/plugin.bifrost`;
    const configResponse = await fetch(configUrl);
    
    if (!configResponse.ok) {
      throw new Error(`Failed to fetch plugin configuration: ${configResponse.statusText}`);
    }
    
    const pluginConfig: PluginConfig = await configResponse.json();
    spinner.succeed('Plugin configuration fetched');
    
    if (pluginConfig.platform !== projectPlatform) {
      throw new Error(`Platform mismatch: Plugin is for ${pluginConfig.platform}, but project is ${projectPlatform}`);
    }
    
    spinner = ora('Installing plugin files...').start();
    
    for (const file of pluginConfig.files) {
      const shouldUseDefault = await prompts({
        type: 'confirm',
        name: 'useDefault',
        message: `Install ${file.name} to ${file.location}?`,
        initial: true
      });
      
      let finalTargetPath = path.join(process.cwd(), file.location);
      
      if (!shouldUseDefault.useDefault) {
        const customLocation = await prompts({
          type: 'text',
          name: 'location',
          message: `Enter custom location for ${file.name}:`,
          initial: file.location
        });
        
        finalTargetPath = path.join(process.cwd(), customLocation.location);
      }
      
      const fileUrl = `https://raw.githubusercontent.com/${pluginGithub}/main/files/${file.name}`;
      const fileResponse = await fetch(fileUrl);
      
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file ${file.name}: ${fileResponse.statusText}`);
      }
      
      const fileContent = await fileResponse.text();
      
      await fs.ensureDir(path.dirname(finalTargetPath));
      await fs.writeFile(finalTargetPath, fileContent, 'utf-8');
      installedFiles.push(finalTargetPath);
    }
    
    spinner.succeed('Plugin files installed');
    
    if (pluginConfig.configs && pluginConfig.configs.length > 0) {
      spinner = ora('Processing configuration files...').start();
      spinner.stop();
      
      await processConfigFiles(pluginGithub, pluginConfig.configs);
      
      console.log(chalk.green('\n✓ Configuration files processed'));
    }
    
    const pkgManager = detectPackageManager();
    
    if (pluginConfig.dependencies && pluginConfig.dependencies.length > 0) {
      spinner = ora('Installing dependencies...').start();
      
      const installCmd = pkgManager === 'npm' ? 'npm install' :
                        pkgManager === 'yarn' ? 'yarn add' :
                        pkgManager === 'pnpm' ? 'pnpm add' :
                        'bun add';
      
      execSync(`${installCmd} ${pluginConfig.dependencies.join(' ')}`, { stdio: 'inherit' });
      installedLibraries.push(...pluginConfig.dependencies);
      
      spinner.succeed('Dependencies installed');
    }
    
    if (pluginConfig.devDependencies && pluginConfig.devDependencies.length > 0) {
      spinner = ora('Installing dev dependencies...').start();
      
      const installCmd = pkgManager === 'npm' ? 'npm install -D' :
                        pkgManager === 'yarn' ? 'yarn add -D' :
                        pkgManager === 'pnpm' ? 'pnpm add -D' :
                        'bun add -D';
      
      execSync(`${installCmd} ${pluginConfig.devDependencies.join(' ')}`, { stdio: 'inherit' });
      installedLibraries.push(...pluginConfig.devDependencies);
      
      spinner.succeed('Dev dependencies installed');
    }
    
    console.log(chalk.green('\n✓ Plugin installed successfully!'));
    
  } catch (error) {
    spinner.fail('Plugin installation failed');
    
    console.log(chalk.yellow('\nRolling back changes...'));
    
    for (const filePath of installedFiles) {
      try {
        await fs.remove(filePath);
      } catch (e) {
        console.error(chalk.red(`Failed to remove ${filePath}`));
      }
    }
    
    if (installedLibraries.length > 0) {
      const pkgManager = detectPackageManager();
      const uninstallCmd = pkgManager === 'npm' ? 'npm uninstall' :
                          pkgManager === 'yarn' ? 'yarn remove' :
                          pkgManager === 'pnpm' ? 'pnpm remove' :
                          'bun remove';
      
      try {
        execSync(`${uninstallCmd} ${installedLibraries.join(' ')}`, { stdio: 'inherit' });
      } catch (e) {
        console.error(chalk.red('Failed to remove installed libraries'));
      }
    }
    
    throw error;
  }
}

function detectPackageManager(): string {
  if (fs.pathExistsSync('bun.lockb')) return 'bun';
  if (fs.pathExistsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.pathExistsSync('yarn.lock')) return 'yarn';
  return 'npm';
}