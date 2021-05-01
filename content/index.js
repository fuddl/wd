(async () => {
  const contentScript = await import(browser.runtime.getURL('content/content.js'));
  contentScript.main();
})();