#!/usr/bin/env tsx

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import { mkdir, rm } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const { config } = JSON.parse(readFileSync(join(dirname(__filename), "../package.json"), "utf-8"));

interface ScriptOptions {
  skipSubmodules: boolean;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  let skipSubmodules = false;

  for (const arg of args) {
    switch (arg) {
      case '--skip-submodules':
        skipSubmodules = true;
        break;
      default:
        console.error(`Invalid option: ${arg}`);
        process.exit(1);
    }
  }

  return { skipSubmodules };
}

async function replaceInFile(filePath: string, searchText: string, replaceText: string) {
  try {
    const content = await readFile(filePath, "utf-8");
    const updatedContent = content.replace(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceText);
    await writeFile(filePath, updatedContent, "utf-8");
    console.log(`Updated imports in: ${filePath}`);
  } catch (error) {
    throw new Error(`Failed to update file ${filePath}: ${error}`);
  }
}

function execCommand(command: string, args: string[] = [], cwd?: string) {
  try {
    execFileSync(command, args, { cwd, stdio: "inherit" });
  } catch {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

async function main() {
  const options = parseArgs();

  try {
    if (!options.skipSubmodules) {
      console.log("Updating git submodules...");
      execCommand("git", ["submodule", "update", "--init", "--recursive", "--remote"]);
      console.log("Fetching tags in aztec-standards...");
      execCommand("git", ["fetch", "--tags"], "deps/aztec-standards");
      console.log("Checking out aztec-standards...");
      execCommand("git", ["checkout", config.aztecStandardsVersion], "deps/aztec-standards");
    } else {
      console.log("Skipping submodule update, removing target directory...");
      const targetPath = "deps/aztec-standards/target";
      if (existsSync(targetPath)) {
        await rm(targetPath, { recursive: true, force: true });
      }
    }

    console.log("Compiling token contract...");
    execCommand("aztec", ["compile", "--package", "token_contract"], "deps/aztec-standards");

    console.log("Generating TypeScript bindings...");
    execCommand("aztec", [
      "codegen",
      "./target/token_contract-Token.json",
      "-o", "./target",
      "-f"
    ], "deps/aztec-standards");

    // Ensure artifact directory exists
    const tokenArtifactDir = "packages/contracts/ts/src/artifacts/token";
    if (!existsSync(tokenArtifactDir)) {
      await mkdir(tokenArtifactDir, { recursive: true });
    }

    console.log("Copying token artifacts to ts library...");
    execCommand("cp", [
      "./target/token_contract-Token.json",
      `../../${tokenArtifactDir}/Token.json`
    ], "deps/aztec-standards");

    execCommand("cp", [
      "./target/Token.ts",
      `../../${tokenArtifactDir}/Token.ts`
    ], "deps/aztec-standards");

    console.log("Fixing import paths...");
    await replaceInFile(
      `./${tokenArtifactDir}/Token.ts`,
      "./token_contract-Token.json",
      "./Token.json"
    );

    // Copy token artifact for Noir TXE test resolution
    const contractsTargetDir = "packages/contracts/contracts/target";
    if (!existsSync(contractsTargetDir)) {
      await mkdir(contractsTargetDir, { recursive: true });
    }

    execCommand("cp", [
      "./target/token_contract-Token.json",
      `../../${contractsTargetDir}/dvp_escrow-Token.json`
    ], "deps/aztec-standards");

    console.log("Token contract build completed successfully!");

  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();
