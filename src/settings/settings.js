document.addEventListener("DOMContentLoaded", () => {
  let getting = browser.storage.sync.get("sidebarLayout");
  getting.then((result) => {
    const value = result['sidebarLayout'] || 'browser'
    document.querySelector(`[name="sidebarLayout"][value="${value}"]`).checked = true
  }, (error) => {
    console.log(`Error: ${error}`)
  });
});
document.querySelector('form').addEventListener('change', () => {
  browser.storage.sync.set({
    sidebarLayout: document.querySelector('[name="sidebarLayout"]:checked').value
  });
})