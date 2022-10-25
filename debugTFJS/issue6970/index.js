async function loadModelP() {
    const model = await tf.loadGraphModel("http://cardiologists.london/static/atria/models/atria/046.yaml__last.ckpt__logit__fp32.onnx-tfjs-uint8/model.json");
    // const model = await tf.loadGraphModel("./models/atria/047.yaml__last.ckpt__logit__fp32.onnx-tfjs-uint8/model.json");
    // const model = await tf.loadGraphModel("./models/atria/048.yaml__last.ckpt__logit__fp32.onnx-tfjs-uint8/model.json");
    return model;
}

function loadImage(url) {
    return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}

async function loadImageAsTensorP(imgPath) {
    const im = await loadImage(imgPath);
    const out = tf.browser.fromPixels(im, 3).resizeBilinear([320, 320])
    return tf.div(out, 255)
}

async function loadImageP(path) {
    const f0 = await loadImageAsTensorP(path)
    return tf.stack([f0])
}

async function inferenceOnTensorP(model, inputTensor) {
    const start = new Date();
    const outputTensor = model.predict(inputTensor)
    const end = new Date();
    const inferenceTime = (end.getTime() - start.getTime()) / 1000;
    return [outputTensor, inferenceTime];
}

async function inferenceOnImageP() {
    const model = await loadModelP()
    const inputTensor = await loadImageP()
    console.log("inputTensor", inputTensor.shape)
    var [outputTensor, inferenceTime] = await inferenceOnTensorP(model, inputTensor);
    console.log("outputTensor", outputTensor.shape)
    console.log("Time", inferenceTime)
}

async function inferenceOnImagesP() {
    const model = await loadModelP();

    inputTensor = await loadImageP("./0.png");
    var [outputTensor, inferenceTime] = await inferenceOnTensorP(model, inputTensor);
    // the network outputs a 1 x 3 x 320 x 320 array (1 image, 3 classes (background, LA, RA) * 320 * 320 pixels)
    // we take an argmax of the 1`th dimension -> 1 * 320 * 320 (where value 0 = background most likely class, 1 LA, 2 RA)
    // we then 'squeeze' it to remove the redunant 0`th dimension, to yield a 320 x 320 array
    const predTensor = tf.squeeze(tf.argMax(outputTensor, 1))
    console.log(inputTensor.shape, " -> ", outputTensor.shape, "->", predTensor.shape, "(" + inferenceTime + "s)")
    // divide by 2 for the sake of plotting, so RA (value 2) becomes 1, ie a while pixel, and LA (value 1) becomes 0.5 (gray pixel)
    var scaledPredTensor = tf.div(predTensor, 2)
    // find the canvas, and then map the tensor back to the canvas's pixels
    var canvas = document.getElementById('canvas0');
    await tf.browser.toPixels(scaledPredTensor, canvas);

    // // repeat single image
    // inputTensor = await loadImageP("./1.png")
    // var [outputTensor, inferenceTime] = await inferenceOnTensorP(model, inputTensor);
    // console.log(inputTensor.shape, " -> ", outputTensor.shape, "(" + inferenceTime + "s)")
    // scaledPredTensor = tf.div(predTensor, 2)
    // canvas = document.getElementById('canvas1');
    // await tf.browser.toPixels(scaledPredTensor, canvas);
}

let pf;
async function inferenceOnImagesPDebug() {
    const model = await loadModelP()

    // single image
    inputTensor = await loadImageP("./0.png")

    tf.ENV.set('DEBUG', true);
    pf = await tf.profile(async () => {
        var [outputTensor, inferenceTime] = await inferenceOnTensorP(model, inputTensor);
        console.log(inputTensor.shape, " -> ", outputTensor.shape, "(" + inferenceTime + "s)")
    });
    console.log(pf);
    tf.ENV.set('DEBUG', false);
}

tf.ready().then(() => {
    tf.setBackend('webgl');
    tf.env().set('WEBGL_EXP_CONV', true);
    console.log('Backend:', tf.getBackend());
    inferenceOnImagesP();
});


















// async function getImageTensorFromPath(path, dims = [1, 3, 320, 320]) {
//     // 1. load the image
//     var image = await loadImagefromPath(path, dims[2], dims[3]);
//     // 2. convert to tensor
//     var imageTensor = imageDataToTensor(image, dims);
//     // 3. return the tensor
//     return imageTensor;
// }

// async function loadImagefromPath(path, width = 320, height = 320) {
//     // Use Jimp to load the image and resize it.
//     var imageData = await Jimp.read(path).then((imageBuffer) => {
//         return imageBuffer.resize(width, height);
//     });

//     return imageData;
// }

// function imageDataToTensor(image, dims) {
//     // 1. Get buffer data from image and create R, G, and B arrays.
//     var imageBufferData = image.bitmap.data;
//     const [redArray, greenArray, blueArray] = new Array(new Array(), new Array(), new Array());

//     // 2. Loop through the image buffer and extract the R, G, and B channels
//     for (let i = 0; i < imageBufferData.length; i += 4) {
//         redArray.push(imageBufferData[i]);
//         greenArray.push(imageBufferData[i + 1]);
//         blueArray.push(imageBufferData[i + 2]);
//         // skip data[i + 3] to filter out the alpha channel
//     }

//     // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
//     const transposedData = redArray.concat(greenArray).concat(blueArray);

//     // 4. convert to float32
//     let i, l = transposedData.length; // length, we need this for the loop
//     // create the Float32Array size 3 * 224 * 224 for these dimensions output
//     const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
//     for (i = 0; i < l; i++) {
//         float32Data[i] = transposedData[i] / 255.0; // convert to float
//     }
//     // 5. create the tensor object from onnxruntime-web.
//     const inputTensor = new ort.Tensor("float32", float32Data, dims);
//     return inputTensor;
// }

// async function runInference(session, preprocessedData) {
//     // Get start time to calculate inference time.
//     const start = new Date();
//     // create feeds with the input name from model export and the preprocessed data.
//     const feeds = {};
//     feeds[session.inputNames[0]] = preprocessedData;
//     // Run the session inference.
//     const outputData = await session.run(feeds);
//     // Get the end time to calculate inference time.
//     const end = new Date();
//     // Convert to seconds.
//     const inferenceTime = (end.getTime() - start.getTime()) / 1000;
//     // Get output results with the output name from the model export.
//     const output = outputData[session.outputNames[0]];
//     return [output, inferenceTime];
// }

// // use an async context to call onnxruntime functions.
// async function inferenceOnImage() {
//     // create a new session and load the specific model.
//     //
//     // the model in this example contains a single MatMul node
//     // it has 1 inputs: 'a'(float32, 3x4) and 'b'(float32, 4x3)
//     // it has 0 output: 'c'(float32, 3x3)
//     const session = await ort.InferenceSession.create('./models/atria/046.yaml__last.ckpt__cls__fp32.onnx', { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });

//     // prepare inputs. a tensor need its corresponding TypedArray as data
//     const imageTensor = await getImageTensorFromPath('http://cardiologists.london/static/atria/images/4ch_rgb.png')
//     console.log('Loaded imageTensor', imageTensor)

//     var [results, inferenceTime] = await runInference(session, imageTensor);

//     console.log('results', results)
//     console.log('time', inferenceTime)

//     // // prepare feeds. use model input names as keys.
//     // const feeds = {}
//     // feeds[session.inputNames[0]] = imageTensor
//     // // const feeds = { 'input': imageTensor };

//     // // feed inputs and run
//     // const results = await session.run(feeds);

//     // // read from results
//     // const y_pred = results.output.data;
//     // console.log("y_pred", y_pred, "Max", Math.max(...y_pred));

//     // // see https://stackoverflow.com/questions/22823752/creating-image-from-array-in-javascript-and-html5
//     // // create an offscreen canvas
//     var canvas = document.createElement("canvas");
//     var ctx = canvas.getContext("2d");
//     canvas.width = 320;
//     canvas.height = 320;

//     // // get the imageData and pixel array from the canvas
//     var imgData = ctx.getImageData(0, 0, 320, 320);
//     var data = imgData.data;

//     // // manipulate some pixel elements
//     for (var i = 0; i < data.length / 4; i++) {
//         i_src_img = i
//         i_src_out = i
//         i_dst = i * 4
//         data[i_dst] = imageTensor.data[i_src_img] * 255
//         data[i_dst + 1] = imageTensor.data[i_src_img + 1] * 255
//         data[i_dst + 2] = imageTensor.data[i_src_img + 2] * 255
//         data[i_dst + 3] = 255;
//         data[i_dst] += (results.data[i_src_out] == 1) * 255
//         data[i_dst + 1] += (results.data[i_src_out + 1] == 2) * 255
//         // data[i_dst+2] = results.data[i_src_out+2] * 255
//         data[i_dst + 3] = 255;
//         // data[i * 4 + 1] = results.data[i * 3 + 1] * 255
//         // data[i * 4 + 2] = results.data[i * 3 + 2] * 255
//         // data[i * 4 + 3] = 255; // make this pixel opaque
//     }

//     console.log('data', data)

//     // // put the modified pixels back on the canvas
//     ctx.putImageData(imgData, 0, 0);

//     // // create a new img object
//     var image = new Image();

//     // // set the img.src to the canvas data url
//     image.src = canvas.toDataURL();

//     // // append the new img object to the page
//     document.body.appendChild(image);
// }

// inferenceOnImage();