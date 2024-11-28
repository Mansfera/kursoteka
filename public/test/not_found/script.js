document.addEventListener("DOMContentLoaded", function () {
  const audio = document.getElementById("background-audio");
  const lobsterContainer = document.querySelector(".lobster-container");

  // Set volume to maximum
  audio.volume = 1.0;

  // Play audio on first click anywhere in the container
  lobsterContainer.addEventListener("click", function () {
    document.getElementById("click-prompt").remove();
    audio.play().catch(function (error) {
      console.log("Audio playback failed:", error);
    });
    lobsterContainer.removeEventListener("click", arguments.callee);
  });
});
