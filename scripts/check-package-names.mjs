const packageNames = [
  "@ai-presence/core",
  "@ai-presence/face",
  "@ai-presence/adapters",
  "@ai-presence/react",
];

let taken = 0;

for (const packageName of packageNames) {
  const encodedName = encodeURIComponent(packageName).replace("%2F", "%2f");
  const response = await fetch(`https://registry.npmjs.org/${encodedName}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ai-presence-kit-release-check",
    },
  });

  if (response.status === 404) {
    console.log(`${packageName}: available (not found in npm registry)`);
    continue;
  }

  if (response.ok) {
    const metadata = await response.json();
    const latest = metadata?.["dist-tags"]?.latest || "published";
    console.log(`${packageName}: taken (${latest})`);
    taken += 1;
    continue;
  }

  console.error(`${packageName}: registry check failed with HTTP ${response.status}`);
  process.exitCode = 1;
}

if (taken > 0) {
  console.error(`${taken} package name${taken === 1 ? " is" : "s are"} already published.`);
  process.exitCode = 1;
}
