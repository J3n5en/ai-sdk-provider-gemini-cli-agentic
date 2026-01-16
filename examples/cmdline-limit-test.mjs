/**
 * Minimal test: Command line argument length limit
 *
 * This test generates increasingly long prompts to find the breaking point
 * on Windows command line (~8191 chars limit).
 *
 * Run: node examples/cmdline-limit-test.mjs
 */

import { spawn } from "node:child_process";

function testCmdLineLength(length) {
  return new Promise((resolve) => {
    // Generate a prompt of specified length
    const prompt = "请回复OK。" + "测试".repeat(Math.floor((length - 10) / 2));

    const args = [
      "-y",
      "@google/gemini-cli",
      "--output-format",
      "stream-json",
      "-m",
      "gemini-2.5-flash",
      "--approval-mode",
      "auto_edit",
      prompt,
    ];

    const shell = process.platform === "win32";

    console.log(`Testing prompt length: ${prompt.length} chars (args total: ~${args.join(" ").length} chars)`);

    const child = spawn("npx", args, {
      shell,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30000,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      resolve({ success: false, error: `Spawn error: ${err.message}` });
    });

    child.on("close", (code) => {
      if (code === 0) {
        // Check if we got a meaningful response
        if (stdout.includes('"role":"assistant"') && stdout.includes("OK")) {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: `Got response but no meaningful content. stdout length: ${stdout.length}`,
          });
        }
      } else {
        resolve({ success: false, error: `Exit code ${code}: ${stderr.slice(0, 200)}` });
      }
    });

    // Timeout
    setTimeout(() => {
      child.kill();
      resolve({ success: false, error: "Timeout" });
    }, 30000);
  });
}

async function main() {
  console.log("=== Command Line Length Limit Test ===");
  console.log(`Platform: ${process.platform}`);
  console.log(`Expected limit on Windows: ~8191 chars\n`);

  const testLengths = [100, 500, 1000, 2000, 4000, 6000, 8000, 10000, 15000];

  for (const length of testLengths) {
    const result = await testCmdLineLength(length);
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${status} - ${length} chars${result.error ? ` (${result.error})` : ""}\n`);

    if (!result.success && length > 4000) {
      console.log(`\n⚠️  Breaking point found around ${length} chars`);
      console.log("This confirms the command line length limitation.");
      break;
    }
  }
}

main();
