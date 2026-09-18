/**
 * header.js — Write Prompt / Test Prompt toggle logic
 *
 * Swaps the body content between the editor+sidebar view
 * and the test-prompt placeholder, without touching the
 * shared header or footer.
 */
(function () {
  function initHeaderTabs() {
    const writeBtn  = document.getElementById("tab-write");
    const testBtn   = document.getElementById("tab-test");
    const writeBody = document.getElementById("write-body");
    const testBody  = document.getElementById("test-body");

    if (!writeBtn || !testBtn) return;

    function activate(mode) {
      const isTest     = mode === "test";
      const enhanceBody = document.getElementById("enhance-body");

      // Toggle pill button active styles
      writeBtn.classList.toggle("active", !isTest);
      testBtn.classList.toggle("active", isTest);

      // Swap body panels — always hide enhance when switching tabs
      writeBody.classList.toggle("hidden", isTest);
      testBody.classList.toggle("hidden", !isTest);
      if (enhanceBody) enhanceBody.classList.add("hidden");

      // Boot wizard when switching into test mode
      if (isTest && window.TabTest) {
        testBody.innerHTML = window.TabTest.render();
        window.TabTest.init();
      }
    }

    writeBtn.addEventListener("click", () => activate("write"));
    testBtn.addEventListener("click",  () => activate("test"));

    // Default: write mode
    activate("write");
  }

  document.addEventListener("DOMContentLoaded", initHeaderTabs);
})();
