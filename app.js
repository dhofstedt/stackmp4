// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  let imageList = [];
  let currentIndex = 0;
  let dragging = false;

  // Get references to DOM elements
  const fileInput = document.getElementById("fileInput");
  const viewer = document.getElementById("viewer");
  const placeholder = document.getElementById("placeholder");
  const imageDisplay = document.getElementById("imageDisplay");
  const sliderContainer = document.getElementById("sliderContainer");
  const sliderTrack = document.getElementById("sliderTrack");
  const sliderThumb = document.getElementById("sliderThumb");

  // When the user uploads files…
  fileInput.addEventListener("change", function (e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Sort files by extracting numbers from their names.
    files.sort((a, b) => {
      const matchA = a.name.match(/\d+/);
      const matchB = b.name.match(/\d+/);
      if (matchA && matchB) {
        return parseInt(matchA[0]) - parseInt(matchB[0]);
      } else if (matchA) {
        return -1;
      } else if (matchB) {
        return 1;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    // Create an array of image objects with a name and an object URL.
    imageList = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    // Start at the first image.
    currentIndex = 0;
    updateImage();
  });

  // Updates the displayed image and the slider thumb position.
  function updateImage() {
    if (imageList.length > 0) {
      placeholder.classList.add("hidden");
      imageDisplay.src = imageList[currentIndex].url;
      imageDisplay.classList.remove("hidden");
      sliderContainer.classList.remove("hidden");
    } else {
      placeholder.classList.remove("hidden");
      imageDisplay.src = "";
      imageDisplay.classList.add("hidden");
      sliderContainer.classList.add("hidden");
    }

    if (!dragging) {
      updateSliderThumb();
    }
  }

  // Listen for mouse wheel events on the viewer for navigation.
  viewer.addEventListener("wheel", function (e) {
    if (imageList.length === 0) return;
    e.preventDefault();
    if (e.deltaY > 0) {
      // Scroll down for next image (but don’t loop past the last image)
      if (currentIndex < imageList.length - 1) {
        currentIndex++;
        updateImage();
      }
    } else if (e.deltaY < 0) {
      // Scroll up for previous image (but don’t loop before the first image)
      if (currentIndex > 0) {
        currentIndex--;
        updateImage();
      }
    }
  });

  // Calculate and set the slider thumb's vertical position based on the current image index.
  function updateSliderThumb() {
    if (imageList.length === 0) {
      sliderThumb.style.top = "0px";
      return;
    }
    const trackHeight = sliderTrack.clientHeight;
    const thumbHeight = sliderThumb.clientHeight;
    const maxTop = trackHeight - thumbHeight;
    let newTop = 0;
    if (imageList.length > 1) {
      newTop = (currentIndex / (imageList.length - 1)) * maxTop;
    }
    sliderThumb.style.top = newTop + "px";
    sliderThumb.setAttribute("aria-valuenow", (currentIndex / (imageList.length - 1)) * 100);
    sliderTrack.setAttribute("aria-valuenow", (currentIndex / (imageList.length - 1)) * 100);
  }

  // Enable dragging of the slider thumb.
  sliderThumb.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    dragging = true;
    sliderThumb.setPointerCapture(e.pointerId);
  });

  sliderThumb.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    e.preventDefault();

    const trackRect = sliderTrack.getBoundingClientRect();
    const thumbHeight = sliderThumb.clientHeight;
    const trackHeight = sliderTrack.clientHeight;
    const maxTop = trackHeight - thumbHeight;

    // Calculate the new thumb top position relative to the slider track.
    let offsetY = e.clientY - trackRect.top;
    let newTop = offsetY - thumbHeight / 2;
    newTop = Math.max(0, Math.min(newTop, maxTop));
    sliderThumb.style.top = newTop + "px";

    // Calculate the corresponding image index based on the thumb’s position.
    const ratio = newTop / maxTop;
    const newIndex = Math.round(ratio * (imageList.length - 1));
    if (newIndex !== currentIndex) {
      currentIndex = newIndex;
      // Update the image immediately without changing the slider thumb (already set by pointermove).
      imageDisplay.src = imageList[currentIndex].url;
    }
  });

  sliderThumb.addEventListener("pointerup", function (e) {
    dragging = false;
    sliderThumb.releasePointerCapture(e.pointerId);
    updateSliderThumb();
  });

  sliderThumb.addEventListener("pointercancel", function (e) {
    dragging = false;
    updateSliderThumb();
  });

  // Optional: Allow clicking on the slider track to jump the thumb to that position.
  sliderTrack.addEventListener("click", function (e) {
    if (imageList.length === 0) return;
    const trackRect = sliderTrack.getBoundingClientRect();
    const thumbHeight = sliderThumb.clientHeight;
    const trackHeight = sliderTrack.clientHeight;
    const maxTop = trackHeight - thumbHeight;

    let offsetY = e.clientY - trackRect.top;
    let newTop = offsetY - thumbHeight / 2;
    newTop = Math.max(0, Math.min(newTop, maxTop));
    sliderThumb.style.top = newTop + "px";

    const ratio = newTop / maxTop;
    currentIndex = Math.round(ratio * (imageList.length - 1));
    updateImage();
  });

  // Add keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (imageList.length === 0) return;
    if (e.key === "ArrowUp" && currentIndex > 0) {
      currentIndex--;
      updateImage();
    } else if (e.key === "ArrowDown" && currentIndex < imageList.length - 1) {
      currentIndex++;
      updateImage();
    }
  });

  // Clean up object URLs when no longer needed
  window.addEventListener("beforeunload", function () {
    imageList.forEach((image) => URL.revokeObjectURL(image.url));
  });
});
