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

export async function createPlugin(): Promise<void> {
  console.log(chalk.blue.bold('\n🚀 Bifrost Plugin Creator\n'));
  
  const answers = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Plugin name:',
      validate: (value) => value.length > 0 ? true : 'Plugin name is required'
    },
    {
      type: 'select',
      name: 'platform',
      message: 'Select platform:',
      choices: [
        { title: 'Remix', value: 'remix' },
        { title: 'Next.js', value: 'nextjs' },
        { title: 'Vite', value: 'vite' },
        { title: 'Other', value: 'other' }
      ]
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      validate: (value) => value.length > 0 ? true : 'Description is required'
    },
    {
      type: 'text',
      name: 'tags',
      message: 'Tags (comma-separated):',
      initial: '',
      format: (value) => value ? value.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    },
    {
      type: 'confirm',
      name: 'addLibraries',
      message: 'Would you like to supply required libraries now?',
      initial: false
    }
  ]);
  
  if (!answers.name) {
    console.log(chalk.yellow('\nPlugin creation cancelled'));
    process.exit(0);
  }
  
  let libraries: string[] = [];
  
  if (answers.addLibraries) {
    console.log(chalk.gray('\nFormat: @remix-run/react, remix-auth, react'));
    const { libraryInput } = await prompts({
      type: 'text',
      name: 'libraryInput',
      message: 'Libraries:',
      initial: ''
    });
    
    if (libraryInput) {
      libraries = libraryInput.split(',').map((l: string) => l.trim()).filter(Boolean);
    }
  }
  
  const { githubUsername } = await prompts({
    type: 'text',
    name: 'githubUsername',
    message: 'GitHub username:',
    validate: (value) => value.length > 0 ? true : 'GitHub username is required'
  });
  
  if (!githubUsername) {
    console.log(chalk.yellow('\nPlugin creation cancelled'));
    process.exit(0);
  }
  
  const { autoGithub } = await prompts({
    type: 'confirm',
    name: 'autoGithub',
    message: 'Auto-create and push to GitHub?',
    initial: true
  });
  
  const pluginDir = path.join(process.cwd(), answers.name);
  
  if (await fs.pathExists(pluginDir)) {
    console.error(chalk.red(`\nError: Directory ${answers.name} already exists`));
    process.exit(1);
  }
  
  console.log(chalk.blue('\n📦 Creating plugin structure...'));
  
  await fs.ensureDir(pluginDir);
  await fs.ensureDir(path.join(pluginDir, 'files'));
  
  const packageJson = {
    name: answers.name,
    version: '1.0.0',
    description: answers.description,
    main: 'index.js',
    type: 'module',
    keywords: answers.tags,
    author: githubUsername,
    license: 'MIT'
  };
  
  await fs.writeJson(path.join(pluginDir, 'package.json'), packageJson, { spaces: 2 });
  
  const pluginConfig: PluginConfig = {
    name: answers.name,
    description: answers.description,
    platform: answers.platform,
    github: `${githubUsername}/${answers.name}`,
    tags: answers.tags,
    libraries: libraries,
    files: [],
    configs: []
  };
  
  await fs.writeJson(path.join(pluginDir, 'plugin.bifrost'), pluginConfig, { spaces: 2 });
  
  const readme = generateReadme(pluginConfig, githubUsername);
  await fs.writeFile(path.join(pluginDir, 'README.md'), readme, 'utf-8');
  
  const gitignore = `node_modules/
.DS_Store
*.log
.env
.env.local
dist/
build/
`;
  await fs.writeFile(path.join(pluginDir, '.gitignore'), gitignore, 'utf-8');
  
  console.log(chalk.green('✓ Plugin structure created'));
  
  if (autoGithub) {
    console.log(chalk.blue('\n📤 Setting up GitHub repository...'));
    
    try {
      process.chdir(pluginDir);
      
      execSync('git init', { stdio: 'inherit' });
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Initial commit: Plugin scaffold"', { stdio: 'inherit' });
      
      execSync(`gh repo create ${answers.name} --public --source=. --remote=origin --push`, { stdio: 'inherit' });
      
      console.log(chalk.green('✓ GitHub repository created and pushed'));
      console.log(chalk.cyan(`\n📍 Repository: https://github.com/${githubUsername}/${answers.name}`));
      
    } catch (error) {
      console.log(chalk.yellow('\n⚠ Could not auto-create GitHub repository'));
      console.log(chalk.gray('You can manually create and push:'));
      console.log(chalk.gray(`  cd ${answers.name}`));
      console.log(chalk.gray('  git init'));
      console.log(chalk.gray('  git add .'));
      console.log(chalk.gray('  git commit -m "Initial commit"'));
      console.log(chalk.gray(`  gh repo create ${answers.name} --public --source=. --remote=origin --push`));
    }
  } else {
    console.log(chalk.blue('\n📝 Manual GitHub setup:'));
    console.log(chalk.gray(`  cd ${answers.name}`));
    console.log(chalk.gray('  git init'));
    console.log(chalk.gray('  git add .'));
    console.log(chalk.gray('  git commit -m "Initial commit"'));
    console.log(chalk.gray(`  gh repo create ${answers.name} --public --source=. --remote=origin --push`));
  }
  
  console.log(chalk.green.bold('\n✨ Plugin created successfully!\n'));
  console.log(chalk.cyan('Next steps:'));
  console.log(chalk.gray(`  1. Add your plugin files to ${answers.name}/files/`));
  console.log(chalk.gray(`  2. Update plugin.bifrost with file mappings`));
  console.log(chalk.gray('  3. Submit to registry: https://bifrost-plugins.dev/submit'));
  console.log();
}

function generateReadme(config: PluginConfig, username: string): string {
  return `# ${config.name}

${config.description}

## Installation

\`\`\`bash
bunx bifrost-plugin ${config.name}
\`\`\`

## Platform

This plugin is designed for **${config.platform}** projects.

## Required Libraries

${config.libraries.length > 0 ? config.libraries.map(lib => `- \`${lib}\``).join('\n') : 'No additional libraries required.'}

## Tags

${config.tags.length > 0 ? config.tags.map(tag => `\`${tag}\``).join(', ') : 'No tags specified.'}

## Files

This plugin will add the following files to your project:

${config.files.length > 0 ? config.files.map(file => `- \`${file.location}\``).join('\n') : 'File mappings to be configured.'}

## Configuration

Add your plugin files to the \`files/\` directory and update \`plugin.bifrost\` with the file mappings:

\`\`\`json
{
  "files": [
    {
      "name": "your-file.tsx",
      "location": "app/path/to/your-file.tsx"
    }
  ]
}
\`\`\`

## Submit to Registry

Once your plugin is ready, submit it to the Bifrost Plugin Registry:

🔗 [Submit Plugin](https://bifrost-plugins.dev/submit)

## Development

1. Add your plugin files to \`files/\` directory
2. Update \`plugin.bifrost\` with file mappings and configurations
3. Test installation in a bifrost project
4. Push changes to GitHub
5. Submit to registry

## License

MIT © ${username}

## Links

- [Bifrost Plugin Registry](https://bifrost-plugins.dev)
- [Plugin Documentation](https://bifrost-plugins.dev/docs)
- [Submit a Plugin](https://bifrost-plugins.dev/submit)
`;
}