// /js/story.js

function loadStoryChapter(chapterName) {
  if (!chapterName || typeof chapterName !== 'string') {
    console.warn("Invalid chapter name provided to loadStoryChapter()");
    return;
  }

  fetch(`/dlc/${chapterName}.json`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (typeof loadStory === 'function') {
        loadStory(data); // Use the correct rendering engine
      } else {
        console.warn("loadStory() function not defined.");
      }
    })
    .catch(err => {
      console.error(`❌ Error loading chapter '${chapterName}':`, err);
    });
}
