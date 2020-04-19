
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

        // TODO: change the duration properties directly in the model .gltf file
        // to avoid this special-case code
        if( clipName === 'walk' || clipName === 'walkslow' ){
          clip.duration /=  2; // half the length of this animation!
        }

      }); // each animation


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
    // app.addCharacter( 'player',   app.models.cow, { position: new THREE.Vector3(0, 0, 0) });
    // app.addCharacter( 'computer', app.models.zebra, { position: new THREE.Vector3(-5, 0, -5) } );

    app.player = new Player('player', app.models.cow, { position: new THREE.Vector3(0, 0, 0) });

    // window.p = app.characters.player; // just for debugging!


    for( let i = 0; i < 20; i++ ){

      // Find a random model to use
      const names = Object.keys( app.models );
      const randomIndex = Math.floor( Math.random() * names.length );
      const modelName = names[ randomIndex ];
      console.log(names, modelName);
      new Character( `${modelName}${i}`, app.models[modelName], {
        position: new THREE.Vector3(
          THREE.Math.randFloatSpread( 100 ),
          0, // THREE.Math.randFloatSpread( 100 ),
          THREE.Math.randFloatSpread( 100 ),
        ),
        // rotation: new Vector3()
      });

    } // add random characters


    // We should only start the animation/draw loop
    // after the models are loaded
    requestAnimationFrame( app.animate );

  }; // modelManager.onLoad


  // app.addCharacter = ( name, model, options={} ) => {
  //   const char = new Character( name, model, options );
  //   // app.characters[ name ] = char;
  //   app.scene.add( char.object );
  // };

};  // app.initCharacters();


class Character {

  // Keep track of all the Character objects we have created: Character.all
  static all = {};

  // Custom each method to loop over every character and run some callback
  // Character.each( c => c.update() );
  static each = (callback) => {
    let i = 0;
    for( const key in Character.all ){
      const char = Character.all[ key ];
      callback( char, key, i ); // run the given callback, passing in each character
      i++;
    }
  };

  // Ruby 'class method/attribute'
  // User.all // call a method defined on the whole class, not on an instance
  // ---

  defaultOptions = {
    position:  new THREE.Vector3(), //{ x: 0, y: 0, z: 0 },
    rotation:  new THREE.Vector3(), //{ x: 0, y: 0, z: 0 },
  };

  defaultState = {
    action: '',
    lastAction: '',
    // position: don't define here, it's in this.object.position
    velocity: new THREE.Vector3(),
    speed: 0
  };

  constructor( name, model, options=this.defaultOptions ){
    console.log('Character()', name, model, options);

    this.name = name;
    this.modelName = model.name; // ???
    this.opts = { ...this.defaultOptions, ...options };  // merge defaults with passed opts
    this.state = { ...this.defaultState }; // TODO: gotcha? Nested objects not cloned, copied by ref

    this.animation = {
      allActions: {},
      action: null,
      mixer: null
    };

    // Make a clone of the loaded model data
    this.modelClone = THREE.SkeletonUtils.clone( model.gltf.scene );
    this.object = new THREE.Object3D();
    // Why do we have to do this? It's not very clear, but
    // some object-related stuff (like collision detection
    // and positioning) doesn't work if you don't do it
    this.object.position.set( this.opts.position.x, this.opts.position.y, this.opts.position.z );
    this.object.add( this.modelClone );

    app.scene.add( this.object ); // add to the game scene immediately

    this.constructor.all[ name ] = this;  // add new character to our list of characters


    // pass in original model
    this.initialiseAnimations( model );

    this.changeState( 'idle' );

  } // constructor()


  initialiseAnimations( model ){

    const defaultAnimation = 'idle';

    this.animation.mixer = new THREE.AnimationMixer( this.modelClone );

    // Init all clips for this model's list of animations
    // (clips are controlled by the mixer, allow start/stop/xfade etc)
    for( const animName in model.animations ){
      const action = this.animation.mixer.clipAction( model.animations[animName] );
      action.name = animName; // for us to use later (to find out which animation finished)
      this.animation.allActions[ animName ] = action;
    } // for each animation

    // Start the default animation playing
    this.animation.action = this.animation.allActions[ defaultAnimation ];
    // this.animation.action.play();

  } // initialiseAnimations()


  changeAnimation( name ){

    this.animation.action.crossFadeTo( this.animation.allActions[name], 1, true );
    this.animation.action = this.animation.allActions[name];  // TODO: is this a problem???
    this.animation.name = name;
    this.animation.action.enabled = true;  // Gets disabled after last crossfade
    this.animation.action.timeScale = 1;
    this.animation.action.reset().play();

  } // changeAnimation()


  // This is called by app.animate, i.e. every re-render (60 times/sec)
  update( deltaTime ){

    // this.object.position.x += this.state.velocity.x;
    // this.object.position.y += this.state.velocity.y;
    // this.object.position.z += this.state.velocity.z;
    // this.object.position.add( this.state.velocity );

    // Which direction are we currently facing in?
    const direction = new THREE.Vector3();
    this.object.getWorldDirection( direction );

    // Walk in that direction at a certain speed
    this.object.position.addScaledVector( direction, this.state.speed  );

    this.animation.mixer.update( deltaTime ); // update the playing animation

  } // update()


  changeState( state, opts={} ){

    console.log('changeState', state );

    if( state === this.state.action ){
      return; // don't do anything if we're already in this state
    }

    this.state.lastAction = this.state.action;
    this.state.action = state;

    app.controls.playerState = state; // for debugging

    switch( state ){
    case 'walk':
      // this.state.velocity = new THREE.Vector3( 0, 0, 0.1 );
      this.state.speed = app.controls.walkSpeed;
      break;
    case 'idle':
      // this.state.velocity = new THREE.Vector3( 0, 0, 0.1 );
      this.state.speed = 0;
      break;

    } // switch( state )

    this.changeAnimation( opts.action || state );

  } // changeState()


} // class Character

// A Player (THE player) is just a special kind of Character
class Player extends Character {

  static all = {};

  static one = null;  // Keep track of the main player we care about: Player.one

  // override the Character constructor with a custom version for Player
  constructor(...args){
    super(...args);  // call the constructor() method of the super-class Character

    if( Player.one === null ) {
      Player.one = this;
    }

  } // constructor()

  // N = 100
  // 100 x 100 = 600,000

  // Override the Character base class update(), so we can do collision detection
  update( deltaTime ){
    super.update( deltaTime ); // still use the parent's version of update()

    // Collision detection!
    // For each NPC, check if we are too close i.e. we have a collision with them
    Character.each( char => {

      if( this.collisionDetect(char) ){
        console.log(`COLLISION! ${this.name} with ${char.name} `);
      }

    }); // Check each NPC for collisions

  } // update()


  collisionDetect( other ){

    // 1. Naive attempt: just check the distance:
    // Math.sqrt( x*x + y*y + z*z )
    return this.object.position.distanceToSquared( other.object.position) < 20;

    // Not accurate enough! Need to do "bounding box intersection" collision detection

  } // collisionDetect()



} // class Player extends Character
