const express = require("express");
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const ngrok = require("ngrok");
const request = require("request");
const sharp = require('sharp');
const {
  simplify,
  weld,
  inspect,
  quantize,
  instance,
  dequantize,
  resample,
  prune,
  draco,
  join,
  flatten,
  sparse,
  textureCompress,
  dedup,
} = require("@gltf-transform/functions");
const { MeshoptSimplifier } = require("meshoptimizer");

const { NodeIO } = require("@gltf-transform/core");
const obj2gltf = require("obj2gltf");
const draco3d = require("draco3dgltf");

const io = new NodeIO();

const app = express();

app.post("/compression", async (req, res) => {
  const processGlb = gltfPipeline.processGlb;

  const glb = fsExtra.readFileSync("gas.glb");
const options = {
    dracoOptions: {
      compressionLevel: 10,
      // compressMeshes: true,
      // quantizePositionBits: 6
    },
  };

  processGlb(glb, options).then(function (results) {
    fsExtra.writeFileSync("gasDraco.glb", results.glb);
  });
});

app.post("/simplify", async (req, res) => {
  let document;
  document = await io.read("christmas2.glb");

  await document.transform(
    weld({ tolerance: 0.0001 }),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.75, error: 0.001 })
  );

  await io.write("simplechrist.glb", document);
});

//Optimize model by all available methods 
app.post("/optimize", async (req, res) => {
  let document;
  document = await io.read("washinton.glb");

  await document.transform(
    // dedup(),
    // instance({min: 2}),
    // flatten(),
    // dequantize(),
    // join(),
    weld({ tolerance: 0.0001 }),     //WORKS
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.75, error: 0.001 }),   //WORKS
    // resample(),
    // prune(),
    // sparse(),
    textureCompress({encoder: sharp,  targetFormat: 'webp'}),    
    draco()   //WORKS
  );

  
  await io.write("dc.glb", document);
});

app.get("/get-properties", async (req, res) => {
  let document;
  document = await io.read("smooth.glb");

  const response = await inspect(document);
  const result = response.meshes;

  let totalVertices = 0;
  let totalTriangles = 0;

  result.properties.forEach((obj) => {
    totalVertices += obj.vertices;
    totalTriangles += obj.glPrimitives;
  });

  res.send({
    totalVertices,
    totalTriangles,
  });
});

app.post("/convert/glb-to-gltf", async (req, res) => {
  const gltftoGLB = gltfPipeline.glbToGltf;
  const gltf = fsExtra.readFileSync("crystal.glb");
  gltftoGLB(gltf).then(function (results) {
    fsExtra.writeJsonSync("converted.gltf", results.gltf);
  });
});

app.post("/convert/gltf-to-glb", async (req, res) => {
  const glbtoGLTF = gltfPipeline.gltfToGlb;
  const gltf = fsExtra.readJsonSync("christmas.gltf");
  glbtoGLTF(gltf).then(function (results) {
    fsExtra.writeFileSync("christmas2.glb", results.glb);
  });
});

app.post("/convert/obj-to-glb", async (req, res) => {
  const options = {
    binary: true,
  };
  obj2gltf("", options).then(function (glb) {
    fsExtra.writeFileSync("googledrive.glb", glb);
  });
});


const port = 3002;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
