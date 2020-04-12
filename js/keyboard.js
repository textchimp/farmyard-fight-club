
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
        player.changeState('walk');
      } else {
        player.changeState('idle');
      }
      break;

    case 'ArrowDown':
      if( pressed ){
        console.log('DOWN pressed!');
        // TODO: work out in changeState how to pass on the correct
        // options object to the call the changeAnimation
        player.changeState('walk', { speedScale: -1} );
      } else {
        console.log('DOWN released!');
      }
      break;

    default:
      console.log('Key not handled: ', ev.key);
      break;
    }
  };


  // Deal with the keys that we need to run code for
  // repeatedly, i.e. they keep triggering actions for
  // as long as they are held (not just when they're first
  // pressed or released)
  app.keys.handleHeldKeys = () => {

    const turnIncrement = 0.03;
    const player = app.characters.player;

    if( app.keys.state.ArrowLeft ){
      player.object.rotateY( turnIncrement );
    } else if( app.keys.state.ArrowRight ){
      player.object.rotateY( -turnIncrement );
    }

  } // handleHeldKeys()


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
