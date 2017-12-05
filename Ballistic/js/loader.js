 WebFont.load({
    google: {
      families: ['Audiowide']
    },
    active:e=>{
    	console.log("font loaded!");
    	// pre-load the images
		PIXI.loader.
		add(["images/tank_blue.png","images/explosions.png","images/tank_red.png"]).
		on("progress",e=>{console.log(`progress=${e.progress}`)}).
		load(setup);
    }
  });