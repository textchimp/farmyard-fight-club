
app.initCharacters = () => {

  // Load the 3D models, and use them to create instances
  // of game characters

  console.log('Loading characters...');

  // Keep track of characters we have added to the game
  app.characters = {};

  app.models = {
    cow: { url: 'assets/models/characters/Cow.gltf'},
    pug: { url: 'assets/models/characters/Pug.gltf'},
    llama: { url: 'assets/models/characters/Llama.gltf'},
    zebra: { url: 'assets/models/characters/Zebra.gltf'},
    horse: { url: 'assets/models/characters/Horse.gltf'},
    pig: { url: 'assets/models/characters/Pig.gltf'},
    sheep: { url: 'assets/models/characters/Sheep.gltf'},
    skeleton: { url: 'assets/models/characters/Skeleton.gltf', process: () => {} },
  };

  // Lets us run a callback when all models are loaded
  const modelManager = new THREE.LoadingManager();
  const gltfLoader = new THREE.GLTFLoader( modelManager );

  // Load all models
  for( const name in app.models ){

    // model is e.g. app.models.cow
    const model = app.models[ name ];

    gltfLoader.load( model.url, gltf => {
      model.gltf = gltf; // reference to the model data
      model.name = name; // to tell them apart internally

      // Build a lookup object of animation clips
      // for each model, keyed by clip name
      model.animations = {};
      model.gltf.animations.forEach( clip => {
        // console.log(name, clip.name);
        const clipName = clip.name.toLowerCase();
        model.animations[ clipName ] = clip;
      }); // each animation

      // model.gltf.scene.position.set(
      //   THREE.Math.randFloatSpread(20),
      //   0, // THREE.Math.randFloatSpread(20),
      //   THREE.Math.randFloatSpread(20)
      // );

      // Annoying special-case code for skeleton
      // TODO: define special-case processing functions
      // inside the object for each model, i.e.
      // app.models.skeleton.process = () => {}
      if( name === 'skeleton' ){
        gltf.scene.traverse( child => {
          if( child.type === 'SkinnedMesh' ){
            child.material.metalness = 0; // too metal
            child.material.color.setRGB( 0.7, 0.7, 0.5 );
          }
        });
      } // skeleton

      // app.scene.add( model.gltf.scene );

      const clipNames = Object.keys( model.animations );
      console.log(`%c${name}`, 'font-size: 10pt; font-weight: bold; color: green', clipNames.join(', ') );

    }); // gltf onload callback

  } // for each model

  modelManager.onLoad = () => {
    console.log('All models loaded!');

    // Create some characters
    app.addCharacter( 'player', app.models.skeleton );


    // We should only start the animation/draw loop
    // after the models are loaded
    requestAnimationFrame( app.animate );

  }; // modelManager.onLoad


  app.addCharacter = ( name, model, options={} ) => {
    const char = new Character( name, model, options );
    app.characters[ name ] = char;
    app.scene.add( char.object );
  };

};  // app.initCharacters();


class Character {

  constructor( name, model, options={} ){
    console.log('Character()', name, model, options);

    this.name = name;
    this.modelName = model.name; // ???
    this.opts = options;

    // Make a clone of the loaded model data
    this.modelClone = THREE.SkeletonUtils.clone( model.gltf.scene );
    this.object = new THREE.Object3D();
    // Why do we have to do this? It's not very clear, but
    // some object-related stuff (like collision detection
    // and positioning) doesn't work if you don't do it
    this.object.add( this.modelClone );

  } // constructor()

} // class Character
