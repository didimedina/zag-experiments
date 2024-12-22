import { createMachine } from "@zag-js/core";

// state
type MachineState = {
  value: "idle" | "focused";
};

// context
type MachineContext = {
  value: string[];
  focusedIndex: number;
};

export const machine = createMachine<MachineState, MachineContext>({
  id: "pin-input",
  context: {
    value: [],
    focusedIndex: -1,
  },
  states: {
    idle: {
      on: {
        "FOCUS": {
          target: "focused",
          actions: ["saveFocusedIndex"],
        },
      },
    },
    focused: {
      on: {
        BLUR: {
          target: "idle",
          actions: ["clearFocusIndex"],
        },
        INPUT: {
          actions: ["setFocusedValue", "focusNextInput"],
        },
        BACKSPACE: {
          actions: ["clearFocusedInput", "focusPreviousInput"],
        },
        PASTE: {
          actions: ["setPastedValue", "focusLastEmptyInput"],
        },
      },
    },
  },
  initial: "",
});
