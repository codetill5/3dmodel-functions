const express = require("express");
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const ngrok = require("ngrok");
const request = require("request");
const { simplify, weld, inspect } = require("@gltf-transform/functions");
const { MeshoptSimplifier } = require("meshoptimizer");
const { NodeIO } = require("@gltf-transform/core");

const io = new NodeIO();

const app = express();

app.post("/compression", async (req, res) => {
  const processGlb = gltfPipeline.processGlb;

  const glb = fsExtra.readFileSync("smooth.glb");
  const options = {
    dracoOptions: {
      compressionLevel: 10,
    },
  };

  processGlb(glb, options).then(function (results) {
    fsExtra.writeFileSync("model-drac.glb", results.glb);
  });
});

app.post("/simplify", async (req, res) => {
  let document;
  document = await io.read("smooth.glb");

  await document.transform(
    weld({ tolerance: 0.0001 }),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.75, error: 0.001 })
  );

  await io.write("modelSimple.glb", document);
});

app.get("/get-properties", async (req, res) => {
  let document;
  document = await io.read("smooth.glb");

  const response = await inspect(document);
  const result = response.meshes

  let totalVertices = 0;
  let totalTriangles = 0;

  result.properties.forEach(obj => {
      totalVertices += obj.vertices;
      totalTriangles += obj.glPrimitives
  });

  res.send({
    totalVertices,
    totalTriangles
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
  const gltf = fsExtra.readJsonSync("scene.gltf");
  glbtoGLTF(gltf).then(function (results) {
    fsExtra.writeFileSync("convert.glb", results.glb);
  });
});

const port = 3002;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
