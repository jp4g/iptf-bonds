#!/usr/bin/env tsx

import { copyFile, readFile, writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "node:url";

async function copyFileWithLog(src: string, dest: string): Promise<void> {
  try {
    await copyFile(src, dest);
    console.log(`Copied: ${src} → ${dest}`);
  } catch (error) {
    throw new Error(`Failed to copy ${src} to ${dest}: ${error}`);
  }
}

async function replaceInFile(filePath: string, searchText: string, replaceText: string): Promise<void> {
  try {
    const content = await readFile(filePath, "utf-8");
    const updatedContent = content.replace(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceText);
    await writeFile(filePath, updatedContent, "utf-8");
    console.log(`Updated imports in: ${filePath}`);
  } catch (error) {
    throw new Error(`Failed to update file ${filePath}: ${error}`);
  }
}

async function main() {
  try {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const rootDir = join(scriptDir, "..");

    console.log(`Working in project directory: ${rootDir}`);
    process.chdir(rootDir);

    // Ensure artifact directories exist
    await mkdir("./ts/src/artifacts/private_bonds", { recursive: true });
    await mkdir("./ts/src/artifacts/dvp_escrow", { recursive: true });

    // Move PrivateBonds artifacts
    console.log("Moving PrivateBonds artifacts...");
    await copyFileWithLog(
      "./contracts/target/private_bonds-PrivateBonds.json",
      "./ts/src/artifacts/private_bonds/PrivateBonds.json"
    );
    await replaceInFile(
      "./ts/src/artifacts/PrivateBonds.ts",
      "../../../contracts/target/private_bonds-PrivateBonds.json",
      "./private_bonds/PrivateBonds.json"
    );

    // Move DvPEscrow artifacts
    console.log("Moving DvPEscrow artifacts...");
    await copyFileWithLog(
      "./contracts/target/dvp_escrow-DvPEscrow.json",
      "./ts/src/artifacts/dvp_escrow/DvPEscrow.json"
    );
    await replaceInFile(
      "./ts/src/artifacts/DvPEscrow.ts",
      "../../../contracts/target/dvp_escrow-DvPEscrow.json",
      "./dvp_escrow/DvPEscrow.json"
    );

    console.log("Artifacts moved and imports fixed successfully!");

  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

main();
