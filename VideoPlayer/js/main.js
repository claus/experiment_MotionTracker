(function() {

	var video;
	var videoWidth;
	var videoHeight;
	var videoContainer = document.querySelector("#video_container");
	var canvas;
	var ctx;
	var ctxFrameData;
	var frameBits;
	var frameBitsWidth = 0;
	var paused = false;
	var interval;

	video = createVideoElement("video/refCam", [ "mp4", "webm" ]);
	video.addEventListener('canplay', onVideoReady, false);
	video.addEventListener('playing', onVideoPlaying, false);
	video.addEventListener('pause', onVideoPause, false);
	videoContainer.appendChild(video);
	video.play();

	function onVideoReady() {
		videoWidth = video.videoWidth;
		videoHeight = video.videoHeight;
		// Create main canvas to display video frames and markers
		canvas = document.createElement("canvas");
		canvas.addEventListener('click', onCanvasClick);
		canvas.width = videoWidth;
		canvas.height = videoHeight;
		canvas.setAttribute("id", "canvas");
		videoContainer.appendChild(canvas);
		ctx = canvas.getContext("2d");
		// Create off-DOM canvas for reading frame number.
		// Reading directly from the main canvas is a problem in
		// browsers that GPU-accelerate canvas (Chrome, for example).
		// Reading pixel data from accelerated canvas requires a GPU
		// read-back which is very slow, so we create a separate
		// canvas for reading the frame number, and keep it off the DOM.
		var frameDataCanvas = document.createElement('canvas');
		frameDataCanvas.width = videoWidth;
		frameDataCanvas.height = 1;
		ctxFrameData = frameDataCanvas.getContext("2d");
		// Scale video to fullscreen
		window.addEventListener("resize", function() { resize(); });
		resize();
	}

	function onVideoPlaying() {
		clearInterval(interval);
		interval = setInterval(onVideoInterval, 1000 / 30);
	}

	function onVideoPause() {
		clearInterval(interval);
	}

	// Main program loop
	// Called 60 times per second when video is playing
	function onVideoInterval() {
		// Copy current video frame into visible canvas
		ctx.drawImage(video, 0, 0);
		// Precalculate pixel positions of encoded bits
		if (!frameBits) {
			initialize();
		}
		// The above might fail for the first frames (in IE9),
		// so double-check if we're ready to go
		if (frameBits) {
			// Get frame number and tracker data for current frame
			var points = trackerData.frames[getFrameNumber()];
			if (points) {
				// Draw trackers according to data from AE
				ctx.fillStyle = "rgba(63, 255, 0, 0.6)";
				for (var i = 0; i < points.length; i++) {
					ctx.save();
					ctx.translate(points[i].x, points[i].y + trackerData.trackers[points[i].i].dy);
					ctx.beginPath();
					ctx.moveTo(0 , 0);
					ctx.lineTo(200, 0);
					ctx.lineTo(200, 100);
					ctx.lineTo(0, 100);
					ctx.closePath();
					ctx.font = "bold 20px sans-serif";
					// ctx.fillStyle = "rgba(255, 255, 255, 1)";
					// ctx.textAlign = "center";
					ctx.fillText("Foul!", 75, -10);
					ctx.fill();
					ctx.restore();
				}
			}
		}
	}

	function onCanvasClick() {
		if (paused) {
			video.play();
		} else {
			video.pause();
		}
		paused = !paused;
	}

	// Get the frame number that is binary-encoded into the video
	function getFrameNumber() {
		// Copy the area in the video where the frame number is encoded
		// (bottom right corner, 8px high) into off-DOM canvas.
		// Copying only one pixel line is sufficient.
		ctxFrameData.drawImage(video, 0, videoHeight - 4, videoWidth, 1, 0, 0, videoWidth, 1);
		// Read pixel data
		var pixeldata = ctxFrameData.getImageData(0, 0, videoWidth, 1).data;
		// Decode frame number
		var frame = 0;
		for (var i = 0; i < frameBits.length; i++) {
			if (pixeldata[frameBits[i].i] > 128) {
				frame |= frameBits[i].b;
			}
		}
		return frame;
	}

	// Precalculate pixel positions of encoded bits
	function initialize() {
		ctxFrameData.drawImage(video, 0, videoHeight - 4, videoWidth, 1, 0, 0, videoWidth, 1);
		var pixeldata = ctxFrameData.getImageData(0, 0, videoWidth, 1).data;
		var i = (videoWidth - 4) * 4;
		var bit = 1;
		var tmpFrameBits = [];
		while (pixeldata[i] > 128 ||  pixeldata[i + 1] > 128) {
			tmpFrameBits.push({ i: i + 1, b: bit });
			bit <<= 1;
			i -= 32;
		}
		if (tmpFrameBits.length > 0) {
			frameBits = tmpFrameBits;
		}
	}

	function createVideoElement(filename, formats) {
		var video = document.createElement("video");
		video.setAttribute("id", "video");
		video.setAttribute("poster", filename + ".jpg");
		video.setAttribute("loop", "loop");
		for (var i = 0; i < formats.length; i++) {
			var source = document.createElement("source");
			source.setAttribute("src", filename + "." + formats[i]);
			source.setAttribute("type", "video/" + formats[i]);
			video.appendChild(source);
		}
		return video;
	}

	function resize() {
		var w = 0;
		var h = 0;
		if (!window.innerWidth) {
			if (!(document.documentElement.clientWidth == 0)) {
				w = document.documentElement.clientWidth;
				h = document.documentElement.clientHeight;
			} else {
				w = document.body.clientWidth;
				h = document.body.clientHeight;
			}
		} else {
			w = window.innerWidth;
			h = window.innerHeight;
		}

		var cw = w;
		var ch = h;
		var aspect = videoWidth / (videoHeight - 8);
		if (w / h > aspect) {
			ch = cw / aspect;
		} else {
			cw = ch * aspect;
		}

		var scale = cw / videoWidth;
		var dx = Math.round((w - cw) / 2);
		var dy = Math.round((h - ch) / 2);
		var translateXForm = "translate(" + dx + "px," + dy + "px)";
		var scaleXForm = "scale(" + scale + "," + scale + ")";
		var transform = translateXForm + " " + scaleXForm;
		var style =
			"-webkit-transform:" + transform + ";" +
			"-moz-transform:" + transform + ";" +
			"-ms-transform:" + transform + ";" +
			"-o-transform:" + transform + ";" +
			"transform:" + transform;
		canvas.setAttribute("style", style);
	}

})();
