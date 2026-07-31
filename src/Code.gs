const CONFIG = Object.freeze({
  owner: "indra-boop",
  repository: "ausport-scraper",
  workflow: "scrape.yml",
  branch: "main",
  githubApiVersion: "2022-11-28",
});

function triggerAusportScraper() {
  const token = PropertiesService
    .getScriptProperties()
    .getProperty("GITHUB_TOKEN");

  if (!token) {
    throw new Error("GITHUB_TOKEN belum disimpan di Script Properties.");
  }

  const endpoint =
    `https://api.github.com/repos/${CONFIG.owner}` +
    `/${CONFIG.repository}` +
    `/actions/workflows/${CONFIG.workflow}/dispatches`;

  const response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": CONFIG.githubApiVersion,
      "User-Agent": "jerco-ausport-google",
    },
    payload: JSON.stringify({
      ref: CONFIG.branch,
    }),
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  console.log(JSON.stringify({
    operation: "workflow_dispatch",
    repository: `${CONFIG.owner}/${CONFIG.repository}`,
    workflow: CONFIG.workflow,
    branch: CONFIG.branch,
    statusCode,
    executedAt: new Date().toISOString(),
  }, null, 2));

  if (statusCode !== 204) {
    throw new Error(
      `GitHub workflow dispatch gagal. HTTP ${statusCode}: ` +
      `${responseBody || "empty response"}`
    );
  }

  return {
    success: true,
    statusCode,
  };
}

function installThreeHourlyTrigger() {
  deleteSchedulerTriggers();

  ScriptApp.newTrigger("triggerAusportScraper")
    .timeBased()
    .everyHours(3)
    .create();

  console.log("Trigger setiap 3 jam berhasil dibuat.");
}

function deleteSchedulerTriggers() {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (trigger.getHandlerFunction() === "triggerAusportScraper") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  console.log("Trigger ausport lama sudah dihapus.");
}

function getLatestAusportRun() {
  const token = PropertiesService
    .getScriptProperties()
    .getProperty("GITHUB_TOKEN");

  if (!token) {
    throw new Error("GITHUB_TOKEN belum tersedia.");
  }

  const endpoint =
    `https://api.github.com/repos/${CONFIG.owner}` +
    `/${CONFIG.repository}` +
    `/actions/workflows/${CONFIG.workflow}/runs` +
    `?branch=${encodeURIComponent(CONFIG.branch)}` +
    `&event=workflow_dispatch&per_page=1`;

  const response = UrlFetchApp.fetch(endpoint, {
    method: "get",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": CONFIG.githubApiVersion,
      "User-Agent": "jerco-ausport-google",
    },
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (statusCode !== 200) {
    throw new Error(
      `Gagal membaca workflow run. HTTP ${statusCode}: ${responseBody}`
    );
  }

  const data = JSON.parse(responseBody);
  const run = data.workflow_runs?.[0];

  if (!run) {
    return {
      found: false,
      message: "Belum ada workflow_dispatch run.",
    };
  }

  const result = {
    found: true,
    runId: run.id,
    runNumber: run.run_number,
    status: run.status,
    conclusion: run.conclusion,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    url: run.html_url,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}
