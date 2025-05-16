function loadStoryChapter(chapterName) {
  fetch(`/dlc/${chapterName}.json`)
    .then(res => res.json())
    .then(data => {
      loadStory(data); // or renderPanels(data), whatever your display engine is
    })
    .catch(err => {
      console.error(`Error loading ${chapterName}:`, err);
    });
}

