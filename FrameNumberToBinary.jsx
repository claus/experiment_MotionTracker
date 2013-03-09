{
    // FrameNumberToBinary.jsx
    // copyright Niko Helle, nikohelle.net

    var bitWidth = 8; // width of the shape representing binary
    var bitHeight = 8; // height of the shape representing binary

    var bit0Color = [1, 0, 0]; // color of the 0-bits [R,G,B] Use only full color values: [1,0,0] or [0,1,0] or [0,0,1]. Other values will not work.
    var bit1Color = [0, 1, 0]; // color of the 1-bits [R,G,B] Use only full color values: [1,0,0] or [0,1,0] or [0,0,1]. Other values will not work.
    var fillColor = [0, 0, 0]; // color of the bar [R,G,B]

    function FrameNumbering(thisObj)
    {
        // get the active composition
        var firstComp = app.project.activeItem;

        // increase the height by the bar height
        firstComp.height = firstComp.height + bitHeight;

        // check if the there is enough space for the binary numbers. If shapes and spacing are wide, the numbers may not fit the video
        if(!checkFrames(firstComp)) {
            return;
        };

        // create the bar
        var bar = firstComp.layers.addSolid(fillColor, "bitBG", firstComp.width, bitHeight, 1);

        // reset anchor for easier positioning
        resetAnchor(bar);

        // position the bar to the bottom of the composition
        setPosition(bar, 0, firstComp.height - bitHeight, false);

        // create shapes
        calcBits(firstComp, bit0Color, bit1Color);

        alert("done");
    }

    // sets position of an element
    function setPosition(element, x, y, z) {
        var pos = element.transform.position.value;
        if(x !== false) pos[0] = x;
        if(y !== false) pos[1] = y;
        if(z !== false) pos[2] = z;
        element.transform.position.setValue(pos);
    }

    // resets anchor to top left corner
    function resetAnchor(element) {
        element.transform.anchorPoint.setValue([0, 0, 0]);
    }

    // calculate whether the binary fits the video
    function checkFrames(comp) {
        var fps = comp.frameRate * comp.duration;
        var bitSpace = fps.toString(2).split("").length * bitWidth;
        if(bitSpace > comp.width) {
            alert("The video is not wide enough for the bit size and spacing. Required width is " + bitSpace + "px and video is " + comp.width + "px wide.");
            return false;
        }
        return true;
     }

    // create shapes
    function calcBits(comp, bit0Color, bit1Color) {
        var fps = comp.frameRate * comp.duration;
        var bin = "1" + fps.toString(2);

        var bar = comp.layers.addSolid(bit0Color, "bitBG0", bitWidth * bin.length, bitHeight, 1);
        resetAnchor(bar);
        setPosition(bar, comp.width - bitWidth * bin.length, comp.height - bitHeight, false);

        for(var i = 0; i < bin.length; i++) {
            createBit(comp, bit1Color, i);
        }
    }

    // create shape
    function createBit(comp, bit1Color, pos) {
        var gfx = comp.layers.addSolid(bit1Color, "bit" + pos, bitWidth, bitHeight, 1);
        resetAnchor(gfx);
        setPosition(gfx, comp.width - (bitWidth * pos) - bitWidth, comp.height - bitHeight, false);
        // add the expression
        var expression =
              'bitpos = ' + pos + ';'
            + 'frame = timeToFrames();'
            + 'frame = parseInt(frame,10).toString(2).split("").reverse().join("");'
            + 'if(frame.length < bitpos) bit = "0"; else bit = frame.substr(bitpos, 1);'
            + 'if(bit == "1") value = 100; else value = 0;';
        gfx.opacity.expression = expression;
    }

    // run the code
    FrameNumbering(this);
}
