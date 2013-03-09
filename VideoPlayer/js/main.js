(function() {

	var video = document.querySelector("#video");
	var canvas = document.querySelector("#canvas");
	var interval;
	var ctx;
	var ctx_hidden;
	var frameBits;
	var frameBitsWidth = 0;

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

	function videoInterval() {
		ctx.drawImage(video, 0, 0);
		if (frameBitsWidth == 0) {
			calcFrameBitsMeta();
		} else {
			var points = trackerData.frames[getFrameNumber()];
			if (points) {
				ctx.fillStyle = "#ff0000";
				for (var i = 0; i < points.length; i++) {
					ctx.fillRect(points[i].x - 10, points[i].y - 10, 20, 20);
				}
			}
		}
	}

	function getFrameNumber() {
		ctx_hidden.drawImage(video, canvas.width - frameBitsWidth, canvas.height - 3, frameBitsWidth, 1, 0, 0, frameBitsWidth, 1);
		var pixeldata = ctx_hidden.getImageData(0, 0, frameBitsWidth, 1).data;
		var frame = 0;
		for (var i = 0; i < frameBits.length; i++) {
			if (pixeldata[frameBits[i].x] > 128) {
				frame |= frameBits[i].b;
			}
		}
		return frame;
	}

	function calcFrameBitsMeta() {
		var bit = 1;
		var x = (canvas.width - 3) * 4;
		var y = canvas.height - 3;
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
		ctx_hidden = createContext(frameBitsWidth);
	}

	function createContext(width) {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = 1;
		return canvas.getContext("2d");
	}

})();
