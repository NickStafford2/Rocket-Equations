export type MissionControlKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "KeyW"
  | "KeyA"
  | "KeyS"
  | "KeyD"
  | "Space"
  | "KeyR";

export type PressedMissionControls = Record<MissionControlKey, boolean>;

export type DirectionKeyState = {
  left: boolean;
  right: boolean;
  thrust: boolean;
};

export const INITIAL_PRESSED_CONTROLS: PressedMissionControls = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  Space: false,
  KeyR: false,
};

export const MISSION_CONTROL_BY_CODE: Partial<Record<string, MissionControlKey>> = {
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  Space: "Space",
  KeyW: "KeyW",
  KeyA: "KeyA",
  KeyS: "KeyS",
  KeyD: "KeyD",
  KeyR: "KeyR",
};

export function createInitialDirectionKeyState(): DirectionKeyState {
  return {
    left: false,
    right: false,
    thrust: false,
  };
}
