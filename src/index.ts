#!/usr/bin/env bun

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import { getProjectConfig, getRegistry, validatePlatformCompatibility } from './utils';
import { installPlugin } from './installer';

const program = new Command();

program
  .name('bifrost-plugin')
  .description('Plugin installer for bifrost projects')
  .version('1.0.0')
  .argument('[plugin-name]', 'Name of the plugin to install')
  .action(async (pluginName?: string) => {
    try {
      const projectConfig = await getProjectConfig();
      
      if (!projectConfig) {
        console.error(chalk.red('Error: config.bifrost not found in current directory'));
        console.log(chalk.yellow('Make sure you are in a bifrost project directory'));
        process.exit(1);
      }
      
      const registry = await getRegistry();
      
      if (pluginName) {
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
        
      } else {
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
      
    } catch (error) {
      console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program.parse();