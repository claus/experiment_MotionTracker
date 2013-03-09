(function() {

	var video = document.querySelector("#video");
	var canvas = document.querySelector("#canvas");
	var interval;
	var ctx;
	var ctxFrameData;
	var frameBits;
	var frameBitsWidth = 0;

	// Set up event handlers and canvas
	video.addEventListener('canplay', function() {
		video.addEventListener('play', videoPlay, false);
		video.addEventListener('pause', videoPause, false);
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		ctx = canvas.getContext("2d");
	}, false);

	function videoPlay() {
		interval = setInterval(videoInterval, 1000 / 60);
	}

	function videoPause() {
		clearInterval(interval);
	}

	/*
		Main program loop
		Called 60 times per second when video is playing
	*/
	function videoInterval() {
		// Copy current video frame into visible canvas
		ctx.drawImage(video, 0, 0);
		// Precalculate pixel positions of encoded bits
		// and create off-DOM canvas for reading frame number
		if (frameBitsWidth == 0) {
			initialize();
		}
		// The above might fail for the first frames (in IE9),
		// so double-check if we're ready to go
		if (frameBitsWidth > 0) {
			// Get frame number and tracker data for current frame
			var points = trackerData.frames[getFrameNumber()];
			if (points) {
				// Draw trackers according to data from AE
				ctx.fillStyle = "#ff0000";
				for (var i = 0; i < points.length; i++) {
					ctx.fillRect(points[i].x - 10, points[i].y - 10, 20, 20);
				}
			}
		}
	}

	/*
		Get the frame number that is binary-encoded into the video
	*/
	function getFrameNumber() {
		// Copy the area in the video where the frame number is encoded
		// (bottom right corner, 8px high) into off-DOM canvas.
		// Copying only one pixel line is sufficient.
		ctxFrameData.drawImage(video, canvas.width - frameBitsWidth, canvas.height - 4, frameBitsWidth, 1, 0, 0, frameBitsWidth, 1);
		// Read pixel data
		var pixeldata = ctxFrameData.getImageData(0, 0, frameBitsWidth, 1).data;
		// Decode frame number
		var frame = 0;
		for (var i = 0; i < frameBits.length; i++) {
			if (pixeldata[frameBits[i].x] > 128) {
				frame |= frameBits[i].b;
			}
		}
		return frame;
	}

	/*
		Precalculate pixel positions of encoded bits
		and create off-DOM canvas for reading frame number
	*/
	function initialize() {
		var bit = 1;
		var x = (canvas.width - 4) * 4;
		var y = canvas.height - 4;
		var pixeldata = ctx.getImageData(0, y, canvas.width, 1).data;
		frameBits = [];
		frameBitsWidth = 0;
		while (pixeldata[x] > 128 ||  pixeldata[x + 1] > 128) {
			frameBitsWidth += 8;
			x -= 32;
		}
		for (var i = frameBitsWidth / 8; i > 0; i--) {
			frameBits.push({ x: (i * 8 - 4) * 4 + 1, b: bit });
			bit <<= 1;
		}
		// Create off-DOM canvas for reading frame number
		var frameDataCanvas = document.createElement('canvas');
		frameDataCanvas.width = frameBitsWidth;
		frameDataCanvas.height = 1;
		ctxFrameData = frameDataCanvas.getContext("2d");
	}

})();
