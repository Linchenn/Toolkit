let device, adapter;

async function ini() {
    // Initialize
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.");
    }

    // representation of a specific piece of GPU hardware.
    // specify whether you want to use low-power or high-performance hardware on devices with multiple GPUs
    adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
    }
    device = await adapter.requestDevice();
}

function copyBuffer(srcBuffer, dstBuffer, bufferSize) {
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(srcBuffer, 0, dstBuffer, 0, bufferSize);
    device.queue.submit([commandEncoder.finish()]);
    return dstBuffer;
}

async function readBuffer(buffer, bufferSize) {
    const stagingBuffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
     });
    await copyBuffer(buffer, stagingBuffer, bufferSize);
    await stagingBuffer.mapAsync(
        GPUMapMode.READ,
        0, // Offset
        bufferSize, // Length
    );
    const copyArrayBuffer = stagingBuffer.getMappedRange(0, bufferSize);
    const data = copyArrayBuffer.slice();
    stagingBuffer.unmap();
    const res = new Float32Array(data);
    console.log(res);
    stagingBuffer.destroy();
    return res;
}

ini();

function encodeBuffer(H, W, C) {
    const S = Math.ceil(C / 4);
    const WORKGROUP_SIZE = 16;
    const SRC_BUFFER_SIZE =  C * H * W * 4;
    const DST_BUFFER_SIZE =  S * H * W * 4 * 4;

    // Create two storage buffers to hold the cell state.
    const dstBuffer = device.createBuffer({
        label: "dst buffer",
        size: DST_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    const srcBuffer = device.createBuffer({
        label: "src buffer",
        size: SRC_BUFFER_SIZE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    // Create an array representing the active state of each cell.
    const sourceArray = new Float32Array(SRC_BUFFER_SIZE / 4);
    // Mark every third cell of the first grid as active.
    for (let i = 0; i < SRC_BUFFER_SIZE / 4; i += 1) {
        sourceArray[i] = i;
    }
    device.queue.writeBuffer(srcBuffer, 0, sourceArray);

    readBuffer(dstBuffer, DST_BUFFER_SIZE);
}
