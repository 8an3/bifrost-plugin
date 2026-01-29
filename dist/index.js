#!/usr/bin/env bun

// src/index.ts
import { Command } from "commander";
import prompts5 from "prompts";
import chalk5 from "chalk";

// src/utils.ts
import fs from "fs-extra";
import path from "path";
async function getProjectConfig() {
  const configPath = path.join(process.cwd(), "config.bifrost");
  if (!await fs.pathExists(configPath)) {
    return null;
  }
  return await fs.readJson(configPath);
}
async function getRegistry() {
  const registryPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "registry.bifrost");
  return await fs.readJson(registryPath);
}
function validatePlatformCompatibility(projectPlatform, pluginPlatform) {
  return projectPlatform === pluginPlatform;
}

// src/installer.ts
import fs3 from "fs-extra";
import path3 from "path";
import { execSync } from "child_process";
import ora from "ora";
import chalk2 from "chalk";
import prompts2 from "prompts";

// src/config-manager.ts
import fs2 from "fs-extra";
import path2 from "path";
import chalk from "chalk";
import prompts from "prompts";
async function processConfigFiles(pluginGithub, configs) {
  for (const config of configs) {
    const targetPath = path2.join(process.cwd(), config.targetFile);
    const configUrl = `https://raw.githubusercontent.com/${pluginGithub}/main/files/${config.configSource}`;
    const configResponse = await fetch(configUrl);
    if (!configResponse.ok) {
      throw new Error(`Failed to fetch config file ${config.configSource}: ${configResponse.statusText}`);
    }
    const configContent = await configResponse.text();
    if (!await fs2.pathExists(targetPath)) {
      console.log(chalk.yellow(`
Target file ${config.targetFile} does not exist. Skipping...`));
      continue;
    }
    const existingContent = await fs2.readFile(targetPath, "utf-8");
    if (await checkIfConfigExists(existingContent, configContent, config.targetFile)) {
      console.log(chalk.green(`
\u2713 Configuration already exists in ${config.targetFile}. Skipping...`));
      continue;
    }
    console.log(chalk.cyan(`
\u{1F4DD} Configuration needed for: ${config.targetFile}`));
    console.log(chalk.gray("\u2500".repeat(50)));
    console.log(configContent);
    console.log(chalk.gray("\u2500".repeat(50)));
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: `How would you like to handle ${config.targetFile}?`,
      choices: [
        { title: "Auto-apply changes", value: "auto" },
        { title: "Copy to clipboard (manual)", value: "manual" },
        { title: "Skip this configuration", value: "skip" }
      ]
    });
    if (action === "skip") {
      console.log(chalk.yellow(`Skipped ${config.targetFile}`));
      continue;
    }
    if (action === "manual") {
      console.log(chalk.blue(`
Please manually add the above configuration to ${config.targetFile}`));
      continue;
    }
    if (action === "auto") {
      await applyConfig(targetPath, existingContent, configContent, config);
      console.log(chalk.green(`\u2713 Applied configuration to ${config.targetFile}`));
    }
  }
}
async function checkIfConfigExists(existingContent, newContent, targetFile) {
  const extension = path2.extname(targetFile);
  if (extension === ".json" || extension === ".jsonc") {
    return checkJsonConfigExists(existingContent, newContent);
  }
  if (extension === ".env") {
    return checkEnvConfigExists(existingContent, newContent);
  }
  const cleanNew = newContent.trim().replace(/\s+/g, " ");
  const cleanExisting = existingContent.trim().replace(/\s+/g, " ");
  return cleanExisting.includes(cleanNew);
}
function checkJsonConfigExists(existingContent, newContent) {
  try {
    const existing = JSON.parse(existingContent);
    const newConfig = JSON.parse(newContent);
    return deepIncludes(existing, newConfig);
  } catch {
    return false;
  }
}
function checkEnvConfigExists(existingContent, newContent) {
  const existingLines = existingContent.split("\n").map((line) => line.trim());
  const newLines = newContent.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  for (const newLine of newLines) {
    const [key] = newLine.split("=");
    const exists = existingLines.some((line) => line.startsWith(`${key}=`));
    if (!exists) {
      return false;
    }
  }
  return true;
}
function deepIncludes(existing, newConfig) {
  if (typeof newConfig !== "object" || newConfig === null) {
    return existing === newConfig;
  }
  for (const key in newConfig) {
    if (!(key in existing)) {
      return false;
    }
    if (typeof newConfig[key] === "object" && newConfig[key] !== null) {
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
async function applyConfig(targetPath, existingContent, newContent, config) {
  const extension = path2.extname(targetPath);
  if (extension === ".json" || extension === ".jsonc") {
    await applyJsonConfig(targetPath, existingContent, newContent);
    return;
  }
  if (extension === ".env") {
    await applyEnvConfig(targetPath, existingContent, newContent);
    return;
  }
  if (config.insertType === "append") {
    const updatedContent = existingContent + "\n\n" + newContent;
    await fs2.writeFile(targetPath, updatedContent, "utf-8");
  } else if (config.insertType === "replace") {
    await fs2.writeFile(targetPath, newContent, "utf-8");
  } else if (config.insertType === "merge") {
    const updatedContent = existingContent + "\n\n" + newContent;
    await fs2.writeFile(targetPath, updatedContent, "utf-8");
  }
}
async function applyJsonConfig(targetPath, existingContent, newContent) {
  const existing = JSON.parse(existingContent);
  const newConfig = JSON.parse(newContent);
  const merged = deepMerge(existing, newConfig);
  await fs2.writeFile(targetPath, JSON.stringify(merged, null, 2), "utf-8");
}
async function applyEnvConfig(targetPath, existingContent, newContent) {
  const existingLines = existingContent.split("\n");
  const newLines = newContent.split("\n").filter((line) => line.trim() && !line.trim().startsWith("#"));
  const existingKeys = new Set(
    existingLines.filter((line) => line.includes("=")).map((line) => line.split("=")[0].trim())
  );
  const linesToAdd = newLines.filter((line) => {
    const key = line.split("=")[0].trim();
    return !existingKeys.has(key);
  });
  if (linesToAdd.length > 0) {
    const updatedContent = existingContent + "\n\n" + linesToAdd.join("\n");
    await fs2.writeFile(targetPath, updatedContent, "utf-8");
  }
}
function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else if (Array.isArray(source[key])) {
      if (Array.isArray(target[key])) {
        output[key] = [.../* @__PURE__ */ new Set([...target[key], ...source[key]])];
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// src/installer.ts
async function installPlugin(pluginGithub, projectPlatform) {
  const installedFiles = [];
  const installedLibraries = [];
  const modifiedConfigFiles = [];
  let spinner = ora("Fetching plugin configuration...").start();
  try {
    const configUrl = `https://raw.githubusercontent.com/${pluginGithub}/main/plugin.bifrost`;
    const configResponse = await fetch(configUrl);
    if (!configResponse.ok) {
      throw new Error(`Failed to fetch plugin configuration: ${configResponse.statusText}`);
    }
    const pluginConfig = await configResponse.json();
    spinner.succeed("Plugin configuration fetched");
    if (pluginConfig.platform !== projectPlatform) {
      throw new Error(`Platform mismatch: Plugin is for ${pluginConfig.platform}, but project is ${projectPlatform}`);
    }
    spinner = ora("Installing plugin files...").start();
    for (const file of pluginConfig.files) {
      const shouldUseDefault = await prompts2({
        type: "confirm",
        name: "useDefault",
        message: `Install ${file.name} to ${file.location}?`,
        initial: true
      });
      let finalTargetPath = path3.join(process.cwd(), file.location);
      if (!shouldUseDefault.useDefault) {
        const customLocation = await prompts2({
          type: "text",
          name: "location",
          message: `Enter custom location for ${file.name}:`,
          initial: file.location
        });
        finalTargetPath = path3.join(process.cwd(), customLocation.location);
      }
      const fileUrl = `https://raw.githubusercontent.com/${pluginGithub}/main/files/${file.name}`;
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file ${file.name}: ${fileResponse.statusText}`);
      }
      const fileContent = await fileResponse.text();
      await fs3.ensureDir(path3.dirname(finalTargetPath));
      await fs3.writeFile(finalTargetPath, fileContent, "utf-8");
      installedFiles.push(finalTargetPath);
    }
    spinner.succeed("Plugin files installed");
    if (pluginConfig.configs && pluginConfig.configs.length > 0) {
      spinner = ora("Processing configuration files...").start();
      spinner.stop();
      await processConfigFiles(pluginGithub, pluginConfig.configs);
      console.log(chalk2.green("\n\u2713 Configuration files processed"));
    }
    const pkgManager = detectPackageManager();
    if (pluginConfig.dependencies && pluginConfig.dependencies.length > 0) {
      spinner = ora("Installing dependencies...").start();
      const installCmd = pkgManager === "npm" ? "npm install" : pkgManager === "yarn" ? "yarn add" : pkgManager === "pnpm" ? "pnpm add" : "bun add";
      execSync(`${installCmd} ${pluginConfig.dependencies.join(" ")}`, { stdio: "inherit" });
      installedLibraries.push(...pluginConfig.dependencies);
      spinner.succeed("Dependencies installed");
    }
    if (pluginConfig.devDependencies && pluginConfig.devDependencies.length > 0) {
      spinner = ora("Installing dev dependencies...").start();
      const installCmd = pkgManager === "npm" ? "npm install -D" : pkgManager === "yarn" ? "yarn add -D" : pkgManager === "pnpm" ? "pnpm add -D" : "bun add -D";
      execSync(`${installCmd} ${pluginConfig.devDependencies.join(" ")}`, { stdio: "inherit" });
      installedLibraries.push(...pluginConfig.devDependencies);
      spinner.succeed("Dev dependencies installed");
    }
    console.log(chalk2.green("\n\u2713 Plugin installed successfully!"));
  } catch (error) {
    spinner.fail("Plugin installation failed");
    console.log(chalk2.yellow("\nRolling back changes..."));
    for (const filePath of installedFiles) {
      try {
        await fs3.remove(filePath);
      } catch (e) {
        console.error(chalk2.red(`Failed to remove ${filePath}`));
      }
    }
    if (installedLibraries.length > 0) {
      const pkgManager = detectPackageManager();
      const uninstallCmd = pkgManager === "npm" ? "npm uninstall" : pkgManager === "yarn" ? "yarn remove" : pkgManager === "pnpm" ? "pnpm remove" : "bun remove";
      try {
        execSync(`${uninstallCmd} ${installedLibraries.join(" ")}`, { stdio: "inherit" });
      } catch (e) {
        console.error(chalk2.red("Failed to remove installed libraries"));
      }
    }
    throw error;
  }
}
function detectPackageManager() {
  if (fs3.pathExistsSync("bun.lockb")) return "bun";
  if (fs3.pathExistsSync("pnpm-lock.yaml")) return "pnpm";
  if (fs3.pathExistsSync("yarn.lock")) return "yarn";
  return "npm";
}

// src/creator.ts
import fs4 from "fs-extra";
import path4 from "path";
import chalk3 from "chalk";
import prompts3 from "prompts";
import { execSync as execSync2 } from "child_process";
async function createPlugin() {
  console.log(chalk3.blue.bold("\n\u{1F680} Bifrost Plugin Creator\n"));
  const answers = await prompts3([
    {
      type: "text",
      name: "name",
      message: "Plugin name:",
      validate: (value) => value.length > 0 ? true : "Plugin name is required"
    },
    {
      type: "select",
      name: "platform",
      message: "Select platform:",
      choices: [
        { title: "Remix", value: "remix" },
        { title: "Next.js", value: "nextjs" },
        { title: "Vite", value: "vite" },
        { title: "Other", value: "other" }
      ]
    },
    {
      type: "text",
      name: "description",
      message: "Description:",
      validate: (value) => value.length > 0 ? true : "Description is required"
    },
    {
      type: "text",
      name: "tags",
      message: "Tags (comma-separated):",
      initial: "",
      format: (value) => value ? value.split(",").map((t) => t.trim()).filter(Boolean) : []
    },
    {
      type: "confirm",
      name: "addLibraries",
      message: "Would you like to supply required libraries now?",
      initial: false
    }
  ]);
  if (!answers.name) {
    console.log(chalk3.yellow("\nPlugin creation cancelled"));
    process.exit(0);
  }
  let libraries = [];
  if (answers.addLibraries) {
    console.log(chalk3.gray("\nFormat: @remix-run/react, remix-auth, react"));
    const { libraryInput } = await prompts3({
      type: "text",
      name: "libraryInput",
      message: "Libraries:",
      initial: ""
    });
    if (libraryInput) {
      libraries = libraryInput.split(",").map((l) => l.trim()).filter(Boolean);
    }
  }
  const { githubUsername } = await prompts3({
    type: "text",
    name: "githubUsername",
    message: "GitHub username:",
    validate: (value) => value.length > 0 ? true : "GitHub username is required"
  });
  if (!githubUsername) {
    console.log(chalk3.yellow("\nPlugin creation cancelled"));
    process.exit(0);
  }
  const { autoGithub } = await prompts3({
    type: "confirm",
    name: "autoGithub",
    message: "Auto-create and push to GitHub?",
    initial: true
  });
  const pluginDir = path4.join(process.cwd(), answers.name);
  if (await fs4.pathExists(pluginDir)) {
    console.error(chalk3.red(`
Error: Directory ${answers.name} already exists`));
    process.exit(1);
  }
  console.log(chalk3.blue("\n\u{1F4E6} Creating plugin structure..."));
  await fs4.ensureDir(pluginDir);
  await fs4.ensureDir(path4.join(pluginDir, "files"));
  const packageJson = {
    name: answers.name,
    version: "1.0.0",
    description: answers.description,
    main: "index.js",
    type: "module",
    keywords: answers.tags,
    author: githubUsername,
    license: "MIT"
  };
  await fs4.writeJson(path4.join(pluginDir, "package.json"), packageJson, { spaces: 2 });
  const pluginConfig = {
    name: answers.name,
    description: answers.description,
    platform: answers.platform,
    github: `${githubUsername}/${answers.name}`,
    tags: answers.tags,
    libraries,
    files: [],
    configs: []
  };
  await fs4.writeJson(path4.join(pluginDir, "plugin.bifrost"), pluginConfig, { spaces: 2 });
  const readme = generateReadme(pluginConfig, githubUsername);
  await fs4.writeFile(path4.join(pluginDir, "README.md"), readme, "utf-8");
  const gitignore = `node_modules/
.DS_Store
*.log
.env
.env.local
dist/
build/
`;
  await fs4.writeFile(path4.join(pluginDir, ".gitignore"), gitignore, "utf-8");
  console.log(chalk3.green("\u2713 Plugin structure created"));
  if (autoGithub) {
    console.log(chalk3.blue("\n\u{1F4E4} Setting up GitHub repository..."));
    try {
      process.chdir(pluginDir);
      execSync2("git init", { stdio: "inherit" });
      execSync2("git add .", { stdio: "inherit" });
      execSync2('git commit -m "Initial commit: Plugin scaffold"', { stdio: "inherit" });
      execSync2(`gh repo create ${answers.name} --public --source=. --remote=origin --push`, { stdio: "inherit" });
      console.log(chalk3.green("\u2713 GitHub repository created and pushed"));
      console.log(chalk3.cyan(`
\u{1F4CD} Repository: https://github.com/${githubUsername}/${answers.name}`));
    } catch (error) {
      console.log(chalk3.yellow("\n\u26A0 Could not auto-create GitHub repository"));
      console.log(chalk3.gray("You can manually create and push:"));
      console.log(chalk3.gray(`  cd ${answers.name}`));
      console.log(chalk3.gray("  git init"));
      console.log(chalk3.gray("  git add ."));
      console.log(chalk3.gray('  git commit -m "Initial commit"'));
      console.log(chalk3.gray(`  gh repo create ${answers.name} --public --source=. --remote=origin --push`));
    }
  } else {
    console.log(chalk3.blue("\n\u{1F4DD} Manual GitHub setup:"));
    console.log(chalk3.gray(`  cd ${answers.name}`));
    console.log(chalk3.gray("  git init"));
    console.log(chalk3.gray("  git add ."));
    console.log(chalk3.gray('  git commit -m "Initial commit"'));
    console.log(chalk3.gray(`  gh repo create ${answers.name} --public --source=. --remote=origin --push`));
  }
  console.log(chalk3.green.bold("\n\u2728 Plugin created successfully!\n"));
  console.log(chalk3.cyan("Next steps:"));
  console.log(chalk3.gray(`  1. Add your plugin files to ${answers.name}/files/`));
  console.log(chalk3.gray(`  2. Update plugin.bifrost with file mappings`));
  console.log(chalk3.gray("  3. Submit to registry: https://bifrost-plugins.dev/submit"));
  console.log();
}
function generateReadme(config, username) {
  return `# ${config.name}

${config.description}

## Installation

\`\`\`bash
bunx bifrost-plugin ${config.name}
\`\`\`

## Platform

This plugin is designed for **${config.platform}** projects.

## Required Libraries

${config.libraries.length > 0 ? config.libraries.map((lib) => `- \`${lib}\``).join("\n") : "No additional libraries required."}

## Tags

${config.tags.length > 0 ? config.tags.map((tag) => `\`${tag}\``).join(", ") : "No tags specified."}

## Files

This plugin will add the following files to your project:

${config.files.length > 0 ? config.files.map((file) => `- \`${file.location}\``).join("\n") : "File mappings to be configured."}

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

\u{1F517} [Submit Plugin](https://bifrost-plugins.dev/submit)

## Development

1. Add your plugin files to \`files/\` directory
2. Update \`plugin.bifrost\` with file mappings and configurations
3. Test installation in a bifrost project
4. Push changes to GitHub
5. Submit to registry

## License

MIT \xA9 ${username}

## Links

- [Bifrost Plugin Registry](https://bifrost-plugins.dev)
- [Plugin Documentation](https://bifrost-plugins.dev/docs)
- [Submit a Plugin](https://bifrost-plugins.dev/submit)
`;
}

// src/submitter.ts
import fs5 from "fs-extra";
import path5 from "path";
import chalk4 from "chalk";
import prompts4 from "prompts";
import { execSync as execSync3 } from "child_process";
var REGISTRY_REPO = "8an3/bifrost-plugin";
var REGISTRY_FILE = "dist/registry.bifrost";
async function submitPlugin() {
  console.log(chalk4.blue.bold("\n\u{1F4E4} Submit Plugin to Registry\n"));
  const pluginConfigPath = path5.join(process.cwd(), "plugin.bifrost");
  if (!await fs5.pathExists(pluginConfigPath)) {
    console.error(chalk4.red("Error: plugin.bifrost not found in current directory"));
    console.log(chalk4.yellow("Make sure you are in your plugin directory"));
    process.exit(1);
  }
  const pluginConfig = await fs5.readJson(pluginConfigPath);
  console.log(chalk4.cyan("\nPlugin Information:"));
  console.log(chalk4.gray("\u2500".repeat(50)));
  console.log(`Name: ${chalk4.white(pluginConfig.name)}`);
  console.log(`Description: ${chalk4.white(pluginConfig.description)}`);
  console.log(`Platform: ${chalk4.white(pluginConfig.platform)}`);
  console.log(`GitHub: ${chalk4.white(pluginConfig.github)}`);
  console.log(`Tags: ${chalk4.white(pluginConfig.tags.join(", "))}`);
  console.log(`Libraries: ${chalk4.white(pluginConfig.libraries.join(", "))}`);
  console.log(chalk4.gray("\u2500".repeat(50)));
  const { confirm } = await prompts4({
    type: "confirm",
    name: "confirm",
    message: "Submit this plugin to the registry?",
    initial: true
  });
  if (!confirm) {
    console.log(chalk4.yellow("\nSubmission cancelled"));
    process.exit(0);
  }
  try {
    const registryEntry = {
      name: pluginConfig.name,
      description: pluginConfig.description,
      platform: pluginConfig.platform,
      github: pluginConfig.github,
      tags: pluginConfig.tags
    };
    console.log(chalk4.blue("\n\u{1F504} Forking registry repository..."));
    execSync3(`gh repo fork ${REGISTRY_REPO} --clone=false`, { stdio: "inherit" });
    const username = execSync3("gh api user -q .login", { encoding: "utf-8" }).trim();
    const forkRepo = `${username}/bifrost-plugin`;
    console.log(chalk4.blue("\u{1F4E5} Cloning forked repository..."));
    const tempDir = path5.join(process.cwd(), ".bifrost-temp");
    await fs5.ensureDir(tempDir);
    execSync3(`gh repo clone ${forkRepo} ${tempDir}`, { stdio: "inherit" });
    console.log(chalk4.blue("\u{1F4CB} Fetching current registry..."));
    const registryUrl = `https://raw.githubusercontent.com/${REGISTRY_REPO}/main/${REGISTRY_FILE}`;
    const registryResponse = await fetch(registryUrl);
    let registry = [];
    if (registryResponse.ok) {
      registry = await registryResponse.json();
    }
    const registryPath = path5.join(tempDir, REGISTRY_FILE);
    await fs5.ensureDir(path5.dirname(registryPath));
    const existingIndex = registry.findIndex((p) => p.name === pluginConfig.name);
    if (existingIndex !== -1) {
      console.log(chalk4.yellow("\n\u26A0 Plugin already exists in registry. Updating..."));
      registry[existingIndex] = registryEntry;
    } else {
      registry.push(registryEntry);
    }
    await fs5.writeJson(registryPath, registry, { spaces: 2 });
    console.log(chalk4.blue("\u{1F4BE} Committing changes..."));
    process.chdir(tempDir);
    execSync3("git add .", { stdio: "inherit" });
    execSync3(`git commit -m "Add/Update plugin: ${pluginConfig.name}"`, { stdio: "inherit" });
    execSync3("git push", { stdio: "inherit" });
    console.log(chalk4.blue("\u{1F500} Creating pull request..."));
    const prUrl = execSync3(
      `gh pr create --repo ${REGISTRY_REPO} --title "Add plugin: ${pluginConfig.name}" --body "Submitting plugin ${pluginConfig.name} to the registry.

Platform: ${pluginConfig.platform}
Description: ${pluginConfig.description}"`,
      { encoding: "utf-8" }
    ).trim();
    process.chdir("..");
    await fs5.remove(tempDir);
    console.log(chalk4.green.bold("\n\u2728 Plugin submitted successfully!\n"));
    console.log(chalk4.cyan("Pull Request:"), chalk4.white(prUrl));
    console.log(chalk4.gray("\nYour plugin will be available once the PR is merged."));
  } catch (error) {
    if (error instanceof Error && error.message.includes("gh: command not found")) {
      console.log(chalk4.red("\n\u274C GitHub CLI (gh) is not installed"));
      console.log(chalk4.yellow("\nManual submission steps:"));
      console.log(chalk4.gray(`1. Fork the repository: https://github.com/${REGISTRY_REPO}`));
      console.log(chalk4.gray(`2. Clone your fork`));
      console.log(chalk4.gray(`3. Add your plugin to ${REGISTRY_FILE}`));
      console.log(chalk4.gray(`4. Commit and push changes`));
      console.log(chalk4.gray(`5. Create a pull request`));
    } else {
      throw error;
    }
  }
}

// src/index.ts
var program = new Command();
program.name("bifrost-plugin").description("Plugin installer for bifrost projects").version("1.0.0");
program.command("create").description("Create a new bifrost plugin").action(async () => {
  try {
    await createPlugin();
  } catch (error) {
    console.error(chalk5.red(`
Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }
});
program.command("list").description("List available plugins to install").action(async () => {
  try {
    await listPlugins();
  } catch (error) {
    console.error(chalk5.red(`
Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }
});
program.command("submit").description("Submit your plugin to the registry").action(async () => {
  try {
    await submitPlugin();
  } catch (error) {
    console.error(chalk5.red(`
Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }
});
program.argument("[plugin-name]", "Name of the plugin to install").action(async (pluginName) => {
  try {
    if (!pluginName) {
      await interactiveMode();
      return;
    }
    const projectConfig = await getProjectConfig();
    if (!projectConfig) {
      console.error(chalk5.red("Error: config.bifrost not found in current directory"));
      console.log(chalk5.yellow("Make sure you are in a bifrost project directory"));
      process.exit(1);
    }
    const registry = await getRegistry();
    const plugin = registry.find((p) => p.name === pluginName);
    if (!plugin) {
      console.error(chalk5.red(`Error: Plugin "${pluginName}" not found in registry`));
      process.exit(1);
    }
    if (!validatePlatformCompatibility(projectConfig.platform, plugin.platform)) {
      console.error(chalk5.red(`Error: Plugin is for ${plugin.platform}, but your project is ${projectConfig.platform}`));
      process.exit(1);
    }
    console.log(chalk5.blue(`Installing ${plugin.name}...`));
    await installPlugin(plugin.github, projectConfig.platform);
  } catch (error) {
    console.error(chalk5.red(`
Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }
});
async function interactiveMode() {
  console.log(chalk5.blue.bold("\n\u{1F309} Bifrost Plugin Manager\n"));
  const { action } = await prompts5({
    type: "select",
    name: "action",
    message: "What would you like to do?",
    choices: [
      { title: "List available plugins to install", value: "list" },
      { title: "Plugin wizard (create your own plugin)", value: "create" },
      { title: "Submit plugin to registry", value: "submit" }
    ]
  });
  if (!action) {
    console.log(chalk5.yellow("\nCancelled"));
    process.exit(0);
  }
  switch (action) {
    case "list":
      await listPlugins();
      break;
    case "create":
      await createPlugin();
      break;
    case "submit":
      await submitPlugin();
      break;
  }
}
async function listPlugins() {
  const projectConfig = await getProjectConfig();
  if (!projectConfig) {
    console.error(chalk5.red("Error: config.bifrost not found in current directory"));
    console.log(chalk5.yellow("Make sure you are in a bifrost project directory"));
    process.exit(1);
  }
  const registry = await getRegistry();
  const compatiblePlugins = registry.filter(
    (p) => validatePlatformCompatibility(projectConfig.platform, p.platform)
  );
  if (compatiblePlugins.length === 0) {
    console.log(chalk5.yellow(`No plugins available for platform: ${projectConfig.platform}`));
    process.exit(0);
  }
  const { selectedPlugin } = await prompts5({
    type: "select",
    name: "selectedPlugin",
    message: "Select a plugin to install:",
    choices: compatiblePlugins.map((p) => ({
      title: `${p.name} - ${p.description}`,
      value: p
    }))
  });
  if (!selectedPlugin) {
    console.log(chalk5.yellow("Installation cancelled"));
    process.exit(0);
  }
  console.log(chalk5.blue(`
Installing ${selectedPlugin.name}...`));
  await installPlugin(selectedPlugin.github, projectConfig.platform);
}
program.parse();
