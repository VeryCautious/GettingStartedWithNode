
import { normalize, diretionBetween, dotProduct } from "./meth";
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
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
var lastState = undefined;
var lastSentState = undefined;
var AmmountOfSameStates = 0;
var Finger;
(function (Finger) {
    Finger[Finger["Thumb"] = 2] = "Thumb";
    Finger[Finger["Index"] = 5] = "Index";
    Finger[Finger["Middle"] = 9] = "Middle";
    Finger[Finger["Ring"] = 13] = "Ring";
    Finger[Finger["Pinky"] = 17] = "Pinky";
})(Finger || (Finger = {}));
const FINGERS = [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky];
function getJointIndexesOf(finger) {
    if (finger === Finger.Thumb) {
        return [2, 3, 4];
    }
    const startIndex = finger;
    return [startIndex, startIndex + 1, startIndex + 2, startIndex + 3];
}
function onResults(results) {
    if (results.rightHandLandmarks) {
        console.log(Math.round(results.rightHandLandmarks[Index_Wrist].x *100) /100,Math.round(results.rightHandLandmarks[Index_Wrist].y *100) /100)
        
        const extendedArray = FINGERS.map(finger => isExtended(results.rightHandLandmarks, finger));
        var newState = {
            thumbExtended: extendedArray[0],
            indexExtended: extendedArray[1],
            middleExtended: extendedArray[2],
            ringExtended: extendedArray[3],
            pinkyExtended: extendedArray[4],
            fingersExtended: extendedArray.filter(b => b).length
        };
        var areSame = lastState !== undefined && statesAreSame(lastState, newState);
        if (areSame) {
            AmmountOfSameStates++;
        }
        else {
            AmmountOfSameStates = 0;
        }
        if (AmmountOfSameStates <= 10)
            console.log("Stability", AmmountOfSameStates);
        if (lastState === undefined || lastSentState === undefined || AmmountOfSameStates === 10) {
            if (lastSentState === undefined || !statesAreSame(lastSentState, newState))
                sendStateToServer(newState);
        }
        lastState = newState;
    }
    DisplayVisualizationOf(results);
}
function sendStateToServer(state) {
    lastSentState = state;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/Commands');
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('recived', this.response);
        }
    };
    xhr.send(JSON.stringify(state));
    console.log('sent', state);
}
function statesAreSame(state1, state2) {
    return state1.thumbExtended == state2.thumbExtended &&
        state1.indexExtended == state2.indexExtended &&
        state1.middleExtended == state2.middleExtended &&
        state1.ringExtended == state2.ringExtended &&
        state1.pinkyExtended == state2.pinkyExtended;
}
function isExtended(landmarks, finger) {
    var indexes = getJointIndexesOf(finger);
    indexes.pop();
    var dirs = indexes.map(i => normalize(diretionBetween(landmarks[i], landmarks[i + 1])));
    var sumError = 0;
    for (let i = 0; i < dirs.length - 1; i++) {
        sumError += Math.abs(1 - dotProduct(dirs[i], dirs[i + 1]));
    }
    if (finger === Finger.Thumb) {
        return sumError < 0.08;
    }
    return sumError < 0.05;
}
function DisplayVisualizationOf(results) {
    if (!results || !results.segmentationMask || !results.image || !results.poseLandmarks) {
        return;
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = 'source-in';
    canvasCtx.fillStyle = '#00FF00';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: '#00FF00', lineWidth: 2 });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: '#FF0000', lineWidth: 2 });
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
        try {
            await holistic.send({ image: videoElement });
        }
        catch (error) {
            console.error(error);
        }
    },
    width: 1280,
    height: 720
});
camera.start();
