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

export const machine = createMachine<MachineContext, MachineState>(
  {
    id: "pin-input",
    context: {
      value: Array.from<string>({ length: 4 }).fill(""),
      focusedIndex: -1,
    },
    watch: {
      focusedIndex: ["executeFocus"],
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
  },
  {
    actions: {
      setFocusedIndex(context, event) {
        // how does this method know to take the usage event and pass it as a second argument?
        context.focusedIndex = event.index;
      },
      clearFocusedIndex(context) {
        context.focusedIndex = -1;
      },
      setFocusedValue(context, event) {
        // setting the focused value means updating the value array. with the value in the correlating input
        // to do that we need to take the value and put it in the right place, so we need the index.
        context.value[context.focusedIndex] = event.value;
      },
      focusNextInput(context, event) {
        // context.focusedIndex = context.focusedIndex++;
        const nextIndex = Math.min(
          context.focusedIndex + 1,
          context.value.length -1
        );
        context.focusedIndex = nextIndex;
      },
      executeFocus(context){
        const inputGroup = document.querySelector("[data-part=input-group]")
        if (!inputGroup || context.focusedIndex === -1) return;
        const inputElements = Array.from<HTMLInputElement>(inputGroup.querySelectorAll("[data-part=input]"));
        const input = inputElements[context.focusedIndex];
        input?.focus();
      }
    },
  }
);
