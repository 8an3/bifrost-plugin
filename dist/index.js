#!/usr/bin/env bun

// src/index.ts
import { Command } from "commander";
import prompts3 from "prompts";
import chalk3 from "chalk";

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

// src/index.ts
var program = new Command();
program.name("bifrost-plugin").description("Plugin installer for bifrost projects").version("1.0.0").argument("[plugin-name]", "Name of the plugin to install").action(async (pluginName) => {
  try {
    const projectConfig = await getProjectConfig();
    if (!projectConfig) {
      console.error(chalk3.red("Error: config.bifrost not found in current directory"));
      console.log(chalk3.yellow("Make sure you are in a bifrost project directory"));
      process.exit(1);
    }
    const registry = await getRegistry();
    if (pluginName) {
      const plugin = registry.find((p) => p.name === pluginName);
      if (!plugin) {
        console.error(chalk3.red(`Error: Plugin "${pluginName}" not found in registry`));
        process.exit(1);
      }
      if (!validatePlatformCompatibility(projectConfig.platform, plugin.platform)) {
        console.error(chalk3.red(`Error: Plugin is for ${plugin.platform}, but your project is ${projectConfig.platform}`));
        process.exit(1);
      }
      console.log(chalk3.blue(`Installing ${plugin.name}...`));
      await installPlugin(plugin.github, projectConfig.platform);
    } else {
      const compatiblePlugins = registry.filter(
        (p) => validatePlatformCompatibility(projectConfig.platform, p.platform)
      );
      if (compatiblePlugins.length === 0) {
        console.log(chalk3.yellow(`No plugins available for platform: ${projectConfig.platform}`));
        process.exit(0);
      }
      const { selectedPlugin } = await prompts3({
        type: "select",
        name: "selectedPlugin",
        message: "Select a plugin to install:",
        choices: compatiblePlugins.map((p) => ({
          title: `${p.name} - ${p.description}`,
          value: p
        }))
      });
      if (!selectedPlugin) {
        console.log(chalk3.yellow("Installation cancelled"));
        process.exit(0);
      }
      console.log(chalk3.blue(`
Installing ${selectedPlugin.name}...`));
      await installPlugin(selectedPlugin.github, projectConfig.platform);
    }
  } catch (error) {
    console.error(chalk3.red(`
Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }
});
program.parse();
