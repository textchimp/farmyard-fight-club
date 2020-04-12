
// Keyboard event handlers and state management goes here

app.initKeys = () => {
  console.log('Initialising keys...');

  app.keys = {
    trackedKeys: {
      ArrowUp: true,
      ArrowDown: true,
      ArrowLeft: true,
      ArrowRight: true,
    },

    state: {},  // which keys are currently held?
  };

  app.keys.handleKey = (ev, pressed) => {

    const player = app.characters.player;

    switch( ev.key ){

    case 'ArrowUp':
      if( pressed ){
        console.log('UP pressed!');
        player.changeAnimation('walk');
      } else {
        console.log('UP released!');
        player.changeAnimation('idle');
      }
      break;

    case 'ArrowDown':
      if( pressed ){
        console.log('DOWN pressed!');
      } else {
        console.log('DOWN released!');
      }
      break;

    default:
      console.log('Key not handled: ', ev.key);
      break;
    }
  };

  // This event fires repeatedly, for as long as the key is held down
  // The rate of repeat depends on your system's key repeat rate setting
  document.addEventListener('keydown', ev => {

    if( !(ev.key in app.keys.trackedKeys) ){
      return; // early return for keys we're not supposed to track
    }

    ev.stopPropagation(); // don't send keys like arrow keys to camera controls

    if( app.keys.state[ ev.key ] ){
      return; // ignore keypress events which are not the first press event (i.e. held)
    }

    app.keys.state[ ev.key ] = true;
    app.keys.handleKey( ev, true ); // handle first press event for this key
  });


  document.addEventListener('keyup', ev => {
    ev.stopPropagation();
    app.keys.state[ ev.key ] = false;  // no longer held down!
    app.keys.handleKey( ev, false );  // call handleKey again, but pressed=false
  });


}; // app.initKeys();
