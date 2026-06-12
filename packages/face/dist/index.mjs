import face from "../src/presence-face.js";

export const FaceExpression = face.FaceExpression;
export const FACE_EXPRESSIONS = face.FACE_EXPRESSIONS;
export const DEFAULT_FACE_CONTROL_PROFILE = face.DEFAULT_FACE_CONTROL_PROFILE;
export const DEFAULT_FACE_MAP = face.DEFAULT_FACE_MAP;
export const FACE_CONTROL_CHANNELS = face.FACE_CONTROL_CHANNELS;
export const createFaceControllerFrameRuntime = face.createFaceControllerFrameRuntime;
export const createFaceControllerRuntime = face.createFaceControllerRuntime;
export const createFaceRenderer = face.createFaceRenderer;
export const renderPresenceFaceSvg = face.renderPresenceFaceSvg;
export const faceControllerFrameForPresence = face.faceControllerFrameForPresence;
export const faceControllerDecisionsForPresence = face.faceControllerDecisionsForPresence;
export const faceControlsForPresence = face.faceControlsForPresence;
export const faceExpressionForPresence = face.faceExpressionForPresence;
export const isFaceExpression = face.isFaceExpression;
export const normalizeFaceExpression = face.normalizeFaceExpression;

export default face;
