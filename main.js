import { getShaderSource } from '../common/shader_loader.js';
const vertShaderCode = await getShaderSource('./shaders/vert.wgsl');
const fragShaderCode = await getShaderSource('./shaders/frag.wgsl');

async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    fail('need a browser that supports WebGPU');
    return;
  }

  // Get a WebGPU context from the canvas and configure it
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('webgpu');
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  let scrollLevel = 1.0;
  let centerX = 0.0;
  let centerY = 0.0;
  
  context.configure({
    device,
    format: presentationFormat,
  });

  const pipeline = device.createRenderPipeline({
    label: 'triangle with uniforms',
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({code: vertShaderCode}),
      entryPoint: "main",
    },
    fragment: {
      module: device.createShaderModule({code: fragShaderCode}),
      entryPoint: "main",
      targets: [{ format: presentationFormat }],
    },
  });

  const renderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        clearValue: [0.4, 0.2, 0.35, 1],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  };

  render(1.0, centerX, centerY, device, context, pipeline, renderPassDescriptor);

  var prevDragOffset = {
    x: 0,
    y: 0
  }

  canvas.onmousedown = (event) => {
    prevDragOffset = {
      x: event.x,
      y: event.y
    }
    // console.log(`${event.type} ${JSON.stringify(prevDragOffset)}`)
  }
  
  // canvas.onmouseup = (event) => {
  //   prevDragOffset = {
  //     x: 0.0,
  //     y: 0.0
  //   }
  //   console.log(`${event.type} ${JSON.stringify(prevDragOffset)}`)
  // }

  canvas.ondrag = (event) => {
    if(event.y < 1.0 && event.x < 1.0) {
      console.log(`${event.type} ${JSON.stringify(event)}`)
    } else {
      document.getElementById("currentCoordinates").textContent = 
        `${event.type} dxy: [ ${event.x - prevDragOffset.x} : ${event.y - prevDragOffset.y} ]`

      var scrollLevelLog = Math.pow(2, scrollLevel)

      centerX -= scrollLevelLog * (event.x - prevDragOffset.x) / 200
      centerY -= scrollLevelLog * (event.y - prevDragOffset.y) / 200

      render(scrollLevelLog, centerX, centerY, device, context, pipeline, renderPassDescriptor);
    }

    prevDragOffset = {
      x: event.x,
      y: event.y
    }
    
  };

  document.onwheel = function(event){ 
    const rect = canvas.getBoundingClientRect()
    
    let scrollDelta = -event.wheelDeltaY / 10000;
    var scrollLevelLog = Math.pow(2, scrollLevel)
    scrollLevel += scrollDelta;
    let scrollExp = Math.pow(2, scrollLevel);
    let scrollDiff = Math.pow(2, scrollDelta);
  
    let x = scrollLevelLog * (event.x - rect.left - 400) / 200;
    let y = scrollLevelLog * (event.y - rect.top - 300) / 200;

    centerX += x * (1 - scrollDiff);
    centerY += y * (1 - scrollDiff);
  
    document.getElementById("scrollLevel").textContent = `Scroll level: ${scrollExp} scrollDiff: ${scrollDiff}`;
  
    document.getElementById("centerCoordinates").textContent = `Center coordinates [ ${centerX} : ${centerY} ]`;
    
    document.getElementById("borderCoordinates").textContent = `x: ${x}, y : ${y}`;

    render(scrollExp, centerX, centerY, device, context, pipeline, renderPassDescriptor);
  };
}

function  render(scaleLevel, centerX, centerY, device, context, pipeline, renderPassDescriptor) {

  console.log(`scaleLevel = ${scaleLevel}`)

  const uniformBufferSize = 16; // offset is 2 32bit floats (4bytes each)
  const uniformBuffer = device.createBuffer({
    label: 'uniforms scroll params',
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // create a typedarray to hold the values for the uniforms in JavaScript
  const uniformValues = new Float32Array(uniformBufferSize / 4);

  uniformValues.set([centerX, centerY], 0);        // set the coordinates
  uniformValues.set([scaleLevel], 2);             // set the scale

  // Set the uniform values in our JavaScript side Float32Array
  // const aspect = canvas.width / canvas.height;
  // uniformValues.set(1.0, 2); // set the scale

  // copy the values from JavaScript to the GPU
  device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

  const bindGroup = device.createBindGroup({
    label: 'triangle bind group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer }},
    ],
  });

  // Get the current texture from the canvas context and
  // set it as the texture to render to.
  renderPassDescriptor.colorAttachments[0].view =
      context.getCurrentTexture().createView();

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass(renderPassDescriptor);
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(6);  // call our vertex shader 3 times
  pass.end();

  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
}

main();

// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\\

