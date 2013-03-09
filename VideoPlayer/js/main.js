(function() {

	var video = document.querySelector("#video");
	var canvas = document.querySelector("#canvas");
	var interval;
	var ctx;
	var ctxFrameData;
	var frameBits;
	var frameBitsWidth = 0;

	video.addEventListener('canplay', function() {
		// Set up event handlers
		video.addEventListener('play', videoPlay, false);
		video.addEventListener('pause', videoPause, false);
		// Set up main canvas and get the context
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		ctx = canvas.getContext("2d");
		// Create off-DOM canvas for reading frame number.
		// Reading directly from the main canvas is a problem in
		// browsers that GPU-accelerate canvas (Chrome, for example).
		// Reading pixel data from accelerated canvas requires a GPU
		// read-back which is very slow, so we create a separate
		// canvas for reading the frame number, and keep it off the DOM.
		var frameDataCanvas = document.createElement('canvas');
		frameDataCanvas.width = video.videoWidth;
		frameDataCanvas.height = 1;
		ctxFrameData = frameDataCanvas.getContext("2d");
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
				ctx.fillStyle = "rgba(230, 116, 98, 0.9)";
				for (var i = 0; i < points.length; i++) {
					ctx.save();
					ctx.translate(points[i].x, points[i].y + trackerData.trackers[points[i].i].dy);
					ctx.rotate(0.7853981633974483); // 45 deg
					ctx.beginPath();
					ctx.moveTo(0, 0);
					ctx.lineTo(30, 0);
					ctx.lineTo(30, 30);
					ctx.lineTo(0, 30);
					ctx.closePath();
					ctx.arc(15, 15, 3, 0, Math.PI * 2, true);
					ctx.fill();
					ctx.restore();
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
		ctxFrameData.drawImage(video, 0, canvas.height - 4, canvas.width, 1, 0, 0, canvas.width, 1);
		// Read pixel data
		var pixeldata = ctxFrameData.getImageData(0, 0, canvas.width, 1).data;
		// Decode frame number
		var frame = 0;
		for (var i = 0; i < frameBits.length; i++) {
			if (pixeldata[frameBits[i].i] > 128) {
				frame |= frameBits[i].b;
			}
		}
		return frame;
	}

	/*
		Precalculate pixel positions of encoded bits
	*/
	function initialize() {
		ctxFrameData.drawImage(video, 0, canvas.height - 4, canvas.width, 1, 0, 0, canvas.width, 1);
		var pixeldata = ctxFrameData.getImageData(0, 0, canvas.width, 1).data;
		var i = (canvas.width - 4) * 4;
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

})();
