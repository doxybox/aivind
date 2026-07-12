const baseUrl = String(process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");

if (!/^https?:\/\//.test(baseUrl)) {
  console.error("Set SMOKE_BASE_URL to the deployment origin before running this check.");
  process.exit(1);
}

const checks = [
  ["/", 200],
  ["/ai", 200],
  ["/login", 200],
  ["/register", 200],
  ["/vilkar", 200],
  ["/personvern", 200],
  ["/api/health", 200],
  ["/artikler/does-not-exist-production-smoke", 404],
];

let failed = false;

for (const [path, expectedStatus] of checks) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: "manual",
      headers: { "User-Agent": "TEKKNO production smoke check" },
    });
    const passed = response.status === expectedStatus;
    failed ||= !passed;
    console.log(`${passed ? "PASS" : "FAIL"} ${path} ${response.status} (expected ${expectedStatus})`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${path} request failed: ${error.message}`);
  }
}

process.exitCode = failed ? 1 : 0;
