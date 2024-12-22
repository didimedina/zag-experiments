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

export const machine = createMachine<MachineContext, MachineState>({
  id: "pin-input",
  context: {
    value: [],
    focusedIndex: -1,
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        "INPUT.FOCUS": {
          target: "focused",
          actions: ["setFocusedIndex"],
        },
      },
    },
    focused: {
      on: {
        "INPUT.BLUR": {
          target: "idle",
          actions: ["clearFocusedIndex"],
        },
        "INPUT.CHANGE": {
          actions: ["setFocusedValue", "focusNextInput"],
        },
        "INPUT.BACKSPACE": {
          actions: ["clearFocusedValue", "focusPreviousInput"],
        },
        "INPUT.PASTE": {
          actions: ["setPastedValue", "focusLastEmptyInput"],
        },
      },
    },
  },
});
