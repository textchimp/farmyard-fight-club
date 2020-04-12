// Load the 3D models, and use them to create instances
// of game characters

console.log('Loading characters...');

app.models = {
  cow: { url: 'assets/models/characters/Cow.gltf'},
  pug: { url: 'assets/models/characters/Pug.gltf'},
  llama: { url: 'assets/models/characters/Llama.gltf'},
  zebra: { url: 'assets/models/characters/Zebra.gltf'},
  horse: { url: 'assets/models/characters/Horse.gltf'},
  pig: { url: 'assets/models/characters/Pig.gltf'},
  sheep: { url: 'assets/models/characters/Sheep.gltf'},
  skeleton: { url: 'assets/models/characters/Skeleton.gltf'},
};

const gltfLoader = new THREE.GLTFLoader();

// Load all models
for( const name in app.models ){

  // model is e.g. app.models.cow
  const model = app.models[ name ];

  gltfLoader.load( model.url, gltf => {
    model.gltf = gltf; // reference to the model data
    model.name = name; // to tell them apart internally
    model.gltf.scene.position.set(
      THREE.Math.randFloatSpread(20),
      0, // THREE.Math.randFloatSpread(20),
      THREE.Math.randFloatSpread(20)
    );
    app.scene.add( model.gltf.scene );
  }); // gltf onload callback


} // for each model
