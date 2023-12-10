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

    // Create the compute shader that will process the simulation.
    const simulationShaderModule = device.createShaderModule({
        label: "Reduce channel padding to dense",
        code: `
        @group(0) @binding(0) var<storage, read_write> cellStateIn: array<f32>;
        @group(0) @binding(1) var<storage, read_write> cellStateOut: array<f32>;

        @compute @workgroup_size(${WORKGROUP_SIZE}, 1, 1)
        fn computeMain(@builtin(workgroup_id) workgroup_id : vec3<u32>,
                        @builtin(global_invocation_id) GlobalId : vec3<u32>,
                        @builtin(local_invocation_id) local_invocation_id : vec3<u32>,
                        @builtin(local_invocation_index) local_invocation_index: u32,) {
            let outputIndex = workgroup_id.x * ${WORKGROUP_SIZE} + local_invocation_index;
            if (outputIndex < ${DST_BUFFER_SIZE / 4}) {
                let c = outputIndex % 4;
                let w = outputIndex / 4 % ${W};
                let h = outputIndex / 4 / ${W} % ${H};
                let s = outputIndex / 4 / ${W} / ${H};
                let mergedC = s * 4 + c;
                if (mergedC < ${C}) {
                    let inputIndex = mergedC + w * ${C} + h * ${W} * ${C};
                    cellStateOut[outputIndex] = cellStateIn[inputIndex];
                } else {
                    cellStateOut[outputIndex] = 0;
                }
            }
        }
        `
    });

    // Create the bind group layout and pipeline layout.
    const bindGroupLayout = device.createBindGroupLayout({
        label: "Bind Group Layout",
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage"} // Cell state input buffer
        }, {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage"} // Cell state output buffer
        }]
    });

    // Create a bind group to pass the grid uniforms into the pipeline
    const bindGroup = device.createBindGroup({
        label: "bind group",
        layout: bindGroupLayout, 
        entries: [{
            binding: 0,
            resource: { buffer: srcBuffer }
        }, {
            binding: 1,
            resource: { buffer: dstBuffer }
        }],
    });

    const pipelineLayout = device.createPipelineLayout({
        label: "Pipeline Layout",
        bindGroupLayouts: [ bindGroupLayout ],
    });

    // Create a compute pipeline that updates the game state.
    const simulationPipeline = device.createComputePipeline({
        label: "Reduce channel padding pipeline",
        layout: pipelineLayout,
        compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
        }
    });

    const encoder = device.createCommandEncoder();
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(simulationPipeline),
    computePass.setBindGroup(0, bindGroup);
    computePass.dispatchWorkgroups(Math.ceil(S * H * W * 4 / WORKGROUP_SIZE), 1, 1);
    computePass.end();
    device.queue.submit([encoder.finish()]);

    readBuffer(dstBuffer, DST_BUFFER_SIZE);
}
