
// For ortProfiling, session.endProfiling will dump results of all runs, so we
// couldn't have a session run multiple times. For webgpuProfiling, layout
// conversion is done in first run, so we need to collect data of second run.
async function runTask(task, ep) {
    let session;
    let sessionStartTime = performance.now();
    let times = [];
    let totalTime = 0;

    const getModelStartTime = performance.now();
    const elapsedTime =
        parseFloat((performance.now() - getModelStartTime).toFixed(2));
    console.info(`${elapsedTime}ms was used to get model`);

    // set sessionOptions
    const sessionOptions = {
        executionProviders: [
            {
                name: ep,
                deviceType: 'gpu',
            },
        ],
        graphOptimizationLevel: 'all',
        logSeverityLevel: 2,
        logVerbosityLevel: 0,
        preferredOutputLocation: 'gpu-buffer',
        layout: 'NHWC',
    };

    //   if (ep === 'webgpu' && disableReadback) {
    //     sessionOptions.preferredOutputLocation = 'gpu-buffer';
    //   }

    //   if (ep === 'webgpu') {
    //     sessionOptions.preferredLayout = layout;
    //   }

    // Set env
    ort.env.wasm.numThreads = 4;
    ort.env.wasm.simd = true;

    // create session
    let feeds = {};
    modelUrl = 'http://127.0.0.1:8080/resnet50.onnx';
    const sessionCreateStartTime = performance.now();
    session = await await ort.InferenceSession.create(modelUrl, sessionOptions);
    if (feeds === undefined) {
        let inputNames = session.inputNames;
        feeds[inputNames[0]] = getTensor('float32', 'random', [1, 224, 224, 3]);
    }

    // run a task
    for (let i = 0; i < 1; i++) {
        if (!sessionStartTime) {
            sessionStartTime = performance.now();
        }
        reportStatus(`Running task ${task} ${i} ...`);

        let results;
        const runOptions = {
            logSeverityLevel: logSeverityLevel,
            logVerbosityLevel: logVerbosityLevel,
        };
        results = await session.run(feeds, runOptions);
        if (ep === 'webgpu' && disableReadback && task !== 'conformance') {
            await ort.env.webgpu.device.queue.onSubmittedWorkDone();
        }
        const elapsedTime =
            parseFloat((performance.now() - sessionStartTime).toFixed(2));
        times.push(elapsedTime + 2);
        sessionStartTime = null;
    }
    session.release();

    return times;
}