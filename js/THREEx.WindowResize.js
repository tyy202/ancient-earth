// This THREEx helper makes it easy to handle window resize.
// It will update renderer and camera when window is resized.
//
// # Usage
//
// **Step 1**: Start updating renderer and camera
//
// ```var windowResize = THREEx.WindowResize(aRenderer, aCamera)```
//    
// **Step 2**: Start updating renderer and camera
//
// ```windowResize.stop()```
// # Code

//

/** @namespace */
var THREEx	= THREEx 		|| {};

/**
 * Update renderer and camera when the window is resized
 * 
 * @param {Object} renderer the renderer to update
 * @param {Object} Camera the camera to update
*/
THREEx.WindowResize	= function(renderer, camera, container){
	var callback	= function(){
		var width = container ? container.clientWidth : window.innerWidth;
		var height = container ? container.clientHeight : window.innerHeight;
		if (!width || !height) return;
		// notify the renderer of the size change
		renderer.setSize(width, height);
		// update the camera
		camera.aspect = width / height;
		// Preserve enough horizontal field of view in a narrow portrait canvas.
		camera.fov = Math.atan(Math.tan(Math.PI / 8) / Math.min(camera.aspect, 1)) * 360 / Math.PI;
		camera.updateProjectionMatrix();
	}
	// bind the resize event
	window.addEventListener('resize', callback, false);
	var observer = container && window.ResizeObserver ? new ResizeObserver(callback) : null;
	if (observer) observer.observe(container);
	callback();
	// return .stop() the function to stop watching window resize
	return {
		/**
		 * Stop watching window resize
		*/
		stop	: function(){
			window.removeEventListener('resize', callback);
			if (observer) observer.disconnect();
		}
	};
}
