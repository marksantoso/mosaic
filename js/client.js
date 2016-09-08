// Mark Santoso

// Load image from file.
function loadImage() {
    var input,
        file,
        fr,
        img,
        columns,
        rows;

    if (typeof window.FileReader !== 'function') {
        write("The file API isn't supported on this browser yet.");
        return;
    }

    input = document.getElementById('imgfile');

    if (!input) {
        console.log("Couldn't find the imgfile element.");
    } else if (!input.files) {
        console.log("This browser doesn't seem to support the `files` property of file inputs.");
    } else if (!input.files[0]) {
        console.log("Please select a file before clicking 'Load'");
    } else {
        file = input.files[0];
        fr = new FileReader();
        fr.onload = createImage;
        fr.readAsDataURL(file);
    }

    function createImage() {
        img = new Image();
        img.onload = imageLoaded;
        img.src = fr.result;
    }

    function imageLoaded() {
        var canvas = document.getElementById("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        columns = Math.floor(canvas.width / TILE_WIDTH);
        rows = Math.floor(canvas.height / TILE_HEIGHT);


        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        getTiles(ctx, columns, rows);

    }

    // Convert rgb conpoenent to hex number
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }


    // Get average colours from tile
    function averageColor(colors) {
        var r = g = b = i = 0;
        var len = colors.length;

        // divide by 4 components
        var count = len / 4;


        // Get total for all components in array
        while (i < len) {
            r += colors[i++];
            g += colors[i++];
            b += colors[i++];
            i++
        }

        // Calc avg based on the total
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        //convert to hex
        return componentToHex(r) + componentToHex(g) + componentToHex(b);

    }

    // Get tiles and get svg from db
    function getTiles(ctx, columns, rows) {

        var colorsArray = [];

        // Loop through rows
        for (var y = 0; y < rows; y++) {

            // loop through columns
            for (var x = 0; x < columns; x++) {
                // Get all colours in tile
                colors = ctx.getImageData(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT).data;

                // Get avg hex code
                hex = averageColor(colors);

                // Call promise that get svg from db
                var color = get('/color/' + hex).then(function(response) {
                    return response;
                }, function(error) {
                    console.error("Failed!", error);
                });

                // Push promise to array
                colorsArray.push(color);
            }
        }


        // Fire callback once all promises in colorsArray have been resolved
        Promise.all(colorsArray).then(function(response) {

            // set new line to number of columns in image
            var newLine = columns;

            for (x = 0; x < response.length; x++) {

                // Check to see if new row needs to be started and apply line break
                if (x == newLine) {
                    var br = document.createElement('br');
                    document.body.appendChild(br);
                    newLine = newLine + columns;
                }

                // convert svg string to dom element
                var parser = new DOMParser();
                var svg = parser.parseFromString(response[x], "image/svg+xml");

                // append svg to page body
                document.body.appendChild(svg.documentElement);

            }
        });
    }
}
