import { FACEMESH_TESSELATION, HAND_CONNECTIONS, Holistic, LandmarkConnectionArray, POSE_CONNECTIONS } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { crossproduct, normalize, diretionBetween, dotProduct, Point } from "./meth";

const videoElement : HTMLVideoElement = <HTMLVideoElement> document.getElementsByClassName('input_video')[0];
const canvasElement : HTMLCanvasElement = <HTMLCanvasElement> document.getElementsByClassName('output_canvas')[0];
const canvasCtx : any = canvasElement.getContext('2d');

const Index_Wrist = 0;

const Index_Thumb_CMC = 1;
const Index_Thumb_MCP = 2;
const Index_Thumb_IP = 3;
const Index_Thumb_TIP = 4;

const Index_IndexFinger_CMC = 5;
const Index_IndexFinger_MCP = 6;
const Index_IndexFinger_IP = 7;
const Index_IndexFinger_TIP = 8;

const Index_MiddleFinger_CMC = 9;
const Index_MiddleFinger_MCP = 10;
const Index_MiddleFinger_IP = 11;
const Index_MiddleFinger_TIP = 12;

const Index_RingFinger_CMC = 13;
const Index_RingFinger_MCP = 14;
const Index_RingFinger_IP = 15;
const Index_RingFinger_TIP = 16;

const Index_Pinky_CMC = 17;
const Index_Pinky_MCP = 18;
const Index_Pinky_IP = 19;
const Index_Pinky_TIP = 20;

enum Finger {
	Thumb = 1,
	Index = 5,
	Middle = 19,
	Ring = 13,
	Pinky = 17,
}

const FINGERS = [Finger.Thumb,Finger.Index,Finger.Middle,Finger.Ring,Finger.Pinky]

function onResults(results :any) {
	
	if (results.rightHandLandmarks) {
		const extendedArray = FINGERS.map(finger => isExtended(results.rightHandLandmarks, finger))
		console.log(extendedArray, extendedArray.filter(b => b).length)
	}

	DisplayVisualizationOf(results);
}



function isExtended(landmarks : Point[], finger: Finger) {
	var dirs = [];
	
	for (let i = finger; i < finger+3; i++) {
		var dir = normalize(diretionBetween(landmarks[i],landmarks[i+1]))
		dirs.push(dir)
	}
	
	var sumError = 0; 
	for (let i = 0; i < dirs.length-1; i++) {
		sumError += Math.abs(1-dotProduct(dirs[i],dirs[i+1]))
	}
	
	return sumError < 0.05
}

function DisplayVisualizationOf(results: any) {
	canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
	canvasCtx.drawImage(results.segmentationMask, 0, 0,
		canvasElement.width, canvasElement.height);

	// Only overwrite existing pixels.
	canvasCtx.globalCompositeOperation = 'source-in';
	canvasCtx.fillStyle = '#00FF00';
	canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

	// Only overwrite missing pixels.
	canvasCtx.globalCompositeOperation = 'destination-atop';
	canvasCtx.drawImage(
		results.image, 0, 0, canvasElement.width, canvasElement.height);

	canvasCtx.globalCompositeOperation = 'source-over';
	drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
		{ color: '#00FF00', lineWidth: 4 });
	drawLandmarks(canvasCtx, results.poseLandmarks,
		{ color: '#FF0000', lineWidth: 2 });
	drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
		{ color: '#C0C0C070', lineWidth: 1 });
	drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
		{ color: '#CC0000', lineWidth: 5 });
	drawLandmarks(canvasCtx, results.leftHandLandmarks,
		{ color: '#00FF00', lineWidth: 2 });
	drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
		{ color: '#00CC00', lineWidth: 5 });
	drawLandmarks(canvasCtx, results.rightHandLandmarks,
		{ color: '#FF0000', lineWidth: 2 });

	canvasCtx.restore();
}

const holistic = new Holistic({
	locateFile: (file) => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
	}
});
holistic.setOptions({
	modelComplexity: 1,
	smoothLandmarks: true,
	enableSegmentation: true,
	smoothSegmentation: true,
	refineFaceLandmarks: true,
	minDetectionConfidence: 0.5,
	minTrackingConfidence: 0.5
});
holistic.onResults(onResults);

const camera = new Camera(videoElement, {
	onFrame: async () => {
		await holistic.send({ image: videoElement });
	},
	width: 1280,
	height: 720
});
camera.start();
