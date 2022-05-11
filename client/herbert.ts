import { FACEMESH_TESSELATION, HAND_CONNECTIONS, Holistic, LandmarkConnectionArray, POSE_CONNECTIONS } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { crossproduct, normalize, diretionBetween, dotProduct, Point } from "./meth";
import { HandState } from "./types";

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

var lastState : HandState|undefined = undefined

enum Finger {
	Thumb = 2,
	Index = 5,
	Middle = 9,
	Ring = 13,
	Pinky = 17,
}

const FINGERS = [Finger.Thumb,Finger.Index,Finger.Middle,Finger.Ring,Finger.Pinky]

function getJointIndexesOf(finger: Finger): number[] {
	if (finger === Finger.Thumb) {
		return [2, 3, 4]
	}
	const startIndex : number = finger
	return [startIndex, startIndex+1, startIndex+2, startIndex+3]
}

function onResults(results :any) {
	
	if (results.rightHandLandmarks) {
		const extendedArray = FINGERS.map(finger => isExtended(results.rightHandLandmarks, finger))

		var newState = {
			thumbExtended: extendedArray[0],
			indexExtended: extendedArray[1],
			middleExtended: extendedArray[2],
			ringExtended: extendedArray[3],
			pinkyExtended: extendedArray[4],
			fingersExtended: extendedArray.filter(b => b).length
		}

		if(lastState === undefined || !statesAreSame(lastState, newState) ){
			sendStateToServer(newState)
		}

		lastState = newState
	}

	DisplayVisualizationOf(results);
}

function sendStateToServer(state : HandState){
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/Commands');
	xhr.setRequestHeader("Content-Type", "application/json");

	xhr.onreadystatechange = function() { // Call a function when the state changes.
		if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
			console.log('recived',this.response)
		}
	}
	xhr.send(JSON.stringify(state));
	console.log('sent',state)
}

function statesAreSame(state1 : HandState, state2 : HandState) : boolean {
	return state1.thumbExtended == state2.thumbExtended &&
	state1.indexExtended == state2.indexExtended &&
	state1.middleExtended == state2.middleExtended &&
	state1.ringExtended == state2.ringExtended &&
	state1.pinkyExtended == state2.pinkyExtended
}

function isExtended(landmarks : Point[], finger: Finger) {
	var indexes = getJointIndexesOf(finger)
	indexes.pop()
	var dirs = indexes.map(i=>normalize(diretionBetween(landmarks[i],landmarks[i+1])));

	var sumError = 0; 
	for (let i = 0; i < dirs.length-1; i++) {
		sumError += Math.abs(1-dotProduct(dirs[i],dirs[i+1]))
	}

	if (finger===Finger.Thumb) {
		return sumError < 0.08
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
