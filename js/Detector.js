/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

	canvas: !! window.CanvasRenderingContext2D,
	webgl: ( function () { try { var canvas = document.createElement( 'canvas' ); return !! window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )(),
	workers: !! window.Worker,
	fileapi: window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage: function () {

		var element = document.createElement( 'div' );
		element.className = 'webgl-error';

		if ( !this.webgl ) {

			element.innerHTML = window.WebGLRenderingContext ? [
				'您的显卡似乎不支持 WebGL。<br />',
				'请使用支持 WebGL 的浏览器，并在设置中启用硬件加速。'
			].join( '\n' ) : [
				'您的浏览器似乎不支持 WebGL。<br/>',
				'请使用支持 WebGL 的浏览器，并在设置中启用硬件加速。'
			].join( '\n' );

		}

		return element;

	},

	addGetWebGLMessage: function (parent ) {

		parent.appendChild( Detector.getWebGLErrorMessage() );

	}

};