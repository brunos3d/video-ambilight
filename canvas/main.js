let intervalId;
const FRAMERATE = 30;

window.onload = function () {
    const canvas = document.getElementById('ambilight');
    const context = canvas.getContext('2d');

    const video = document.getElementById('video');

    function repaintAmbilight() {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    }

    function startAmbilightRepaint() {
        intervalId = window.setInterval(repaintAmbilight, 1000 / FRAMERATE);
    }

    function stopAmbilightRepaint() {
        clearInterval(intervalId);
    }

    video.addEventListener('play', startAmbilightRepaint);

    video.addEventListener('pause', stopAmbilightRepaint);

    video.addEventListener('ended', stopAmbilightRepaint);

    video.addEventListener('seeked', repaintAmbilight);

    video.addEventListener('load', repaintAmbilight);

    // load first frame
    repaintAmbilight();
    video.currentTime = 0;
};
