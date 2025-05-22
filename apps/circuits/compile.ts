import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { execSync } from "child_process"; // Added to execute shell commands

// Load template
const templateSourceMain = fs.readFileSync(path.join(__dirname, "templates", "template.main.nr"), "utf-8");
const templateMain = Handlebars.compile(templateSourceMain);

const templateSourceNargo = fs.readFileSync(path.join(__dirname, "templates", "template.Nargo.toml"), "utf-8");
const templateNargo = Handlebars.compile(templateSourceNargo);

const MAX_DEPTH = 20;
const TRIE_LENGTH = 532;

// Generate code files for depths 1 to 20
// Realistically, it's unlikely that we'll need more than 20 though the formal limit is 64
for (let depth = 1; depth <= MAX_DEPTH; depth++) {
  const proofLength = depth * TRIE_LENGTH;

  const outputMain = templateMain({ depth, proof_length: proofLength });
  const outputNargo = templateNargo({ depth, proof_length: proofLength });

  const outputPathMain = path.join(__dirname, "src", `main.nr`);
  const outputPathNargo = path.join(__dirname, `Nargo.toml`);

  // Write the files
  fs.writeFileSync(outputPathMain, outputMain);
  fs.writeFileSync(outputPathNargo, outputNargo);

  console.log(`Generated: ${outputPathMain}`);
  console.log(`Generated: ${outputPathNargo}`);
  
  let hasError = false;
  
  try {
    // Compile the code
    console.log(`Compiling for depth ${depth}...`);
    execSync("nargo compile", { stdio: 'inherit' });
    console.log(`Successfully compiled for depth ${depth}`);

    const targetDir = path.join(__dirname, "target");
    const jsonFile = path.join(targetDir, `dao_leaks_depth_${depth}.json`);
    console.log(`Processing additional operations for depth ${depth}...`);
    
    // Generate target/vk
    console.log("Generating verification key...");
    execSync(`bb write_vk -b ${jsonFile} -o ${targetDir} --oracle_hash keccak`, { stdio: 'inherit' });
    
    // Generate Solidity verifier
    const contractsDir = path.join(__dirname, "..", "contracts", "src", "verifiers");
    console.log("Generating Solidity verifier...");
    execSync(`bb write_solidity_verifier -k ${path.join(targetDir, "vk")} -o ${path.join(contractsDir, `DaoLeaksDepth${depth}.sol`)}`, { stdio: 'inherit' });
    

  } catch (error) {
    console.error(`Compilation failed for depth ${depth}:`, error);
    hasError = true;
  } finally {
    // Clean up files after compilation
    console.log(`Cleaning up files for depth ${depth}...`);
    if (fs.existsSync(outputPathMain)) {
      fs.unlinkSync(outputPathMain);
      console.log(`Deleted: ${outputPathMain}`);
    }
    if (fs.existsSync(outputPathNargo)) {
      fs.unlinkSync(outputPathNargo);
      console.log(`Deleted: ${outputPathNargo}`);
    }
  }

  if (hasError) {
    console.error(`Compilation failed for depth ${depth}`);
    process.exit(1);
  }
  
  console.log(`Completed processing for depth ${depth}\n`);
}