import core from "../src/presence-core.js";

export const PresenceState = core.PresenceState;
export const PresenceEvent = core.PresenceEvent;
export const PRESENCE_STATES = core.PRESENCE_STATES;
export const PRESENCE_EVENTS = core.PRESENCE_EVENTS;
export const createPresenceControlInputRuntime = core.createPresenceControlInputRuntime;
export const createPresenceTrace = core.createPresenceTrace;
export const createPresenceRuntime = core.createPresenceRuntime;
export const isPresenceState = core.isPresenceState;
export const normalizePresenceState = core.normalizePresenceState;
export const presenceControlInputsForSnapshot = core.presenceControlInputsForSnapshot;
export const reducePresenceState = core.reducePresenceState;

export default core;
