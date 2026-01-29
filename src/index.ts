#!/usr/bin/env bun

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import { getProjectConfig, getRegistry, validatePlatformCompatibility } from './utils';
import { installPlugin } from './installer';
import { createPlugin } from './creator';
import { submitPlugin } from './submitter';

const program = new Command();

program
  .name('bifrost-plugin')
  .description('Plugin installer for bifrost projects')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new bifrost plugin')
  .action(async () => {
    try {
      await createPlugin();
    } catch (error) {
      console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available plugins to install')
  .action(async () => {
    try {
      await listPlugins();
    } catch (error) {
      console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program
  .command('submit')
  .description('Submit your plugin to the registry')
  .action(async () => {
    try {
      await submitPlugin();
    } catch (error) {
      console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program
  .argument('[plugin-name]', 'Name of the plugin to install')
  .action(async (pluginName?: string) => {
    try {
      if (!pluginName) {
        await interactiveMode();
        return;
      }

      const projectConfig = await getProjectConfig();
      
      if (!projectConfig) {
        console.error(chalk.red('Error: config.bifrost not found in current directory'));
        console.log(chalk.yellow('Make sure you are in a bifrost project directory'));
        process.exit(1);
      }
      
      const registry = await getRegistry();
      const plugin = registry.find(p => p.name === pluginName);
      
      if (!plugin) {
        console.error(chalk.red(`Error: Plugin "${pluginName}" not found in registry`));
        process.exit(1);
      }
      
      if (!validatePlatformCompatibility(projectConfig.platform, plugin.platform)) {
        console.error(chalk.red(`Error: Plugin is for ${plugin.platform}, but your project is ${projectConfig.platform}`));
        process.exit(1);
      }
      
      console.log(chalk.blue(`Installing ${plugin.name}...`));
      await installPlugin(plugin.github, projectConfig.platform);
      
    } catch (error) {
      console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

async function interactiveMode(): Promise<void> {
  console.log(chalk.blue.bold('\n🌉 Bifrost Plugin Manager\n'));
  
  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { title: 'List available plugins to install', value: 'list' },
      { title: 'Plugin wizard (create your own plugin)', value: 'create' },
      { title: 'Submit plugin to registry', value: 'submit' }
    ]
  });
  
  if (!action) {
    console.log(chalk.yellow('\nCancelled'));
    process.exit(0);
  }
  
  switch (action) {
    case 'list':
      await listPlugins();
      break;
    case 'create':
      await createPlugin();
      break;
    case 'submit':
      await submitPlugin();
      break;
  }
}

async function listPlugins(): Promise<void> {
  const projectConfig = await getProjectConfig();
  
  if (!projectConfig) {
    console.error(chalk.red('Error: config.bifrost not found in current directory'));
    console.log(chalk.yellow('Make sure you are in a bifrost project directory'));
    process.exit(1);
  }
  
  const registry = await getRegistry();
  const compatiblePlugins = registry.filter(p => 
    validatePlatformCompatibility(projectConfig.platform, p.platform)
  );
  
  if (compatiblePlugins.length === 0) {
    console.log(chalk.yellow(`No plugins available for platform: ${projectConfig.platform}`));
    process.exit(0);
  }
  
  const { selectedPlugin } = await prompts({
    type: 'select',
    name: 'selectedPlugin',
    message: 'Select a plugin to install:',
    choices: compatiblePlugins.map(p => ({
      title: `${p.name} - ${p.description}`,
      value: p
    }))
  });
  
  if (!selectedPlugin) {
    console.log(chalk.yellow('Installation cancelled'));
    process.exit(0);
  }
  
  console.log(chalk.blue(`\nInstalling ${selectedPlugin.name}...`));
  await installPlugin(selectedPlugin.github, projectConfig.platform);
}

program.parse();