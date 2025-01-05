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
      clearFocusedValue(context) {
        context.value[context.focusedIndex] = "";
      },
      focusPreviousInput(context) {
        const prevInput = Math.max(0, context.focusedIndex - 1);
        context.focusedIndex = prevInput;
      },
      focusNextInput(context) {
        const nextIndex = Math.min(
          context.focusedIndex + 1,
          context.value.length - 1
        );
        context.focusedIndex = nextIndex;
      },
      executeFocus(context) {
        const inputGroup = document.querySelector("[data-part=input-group]");
        if (!inputGroup || context.focusedIndex === -1) return;
        const inputElements = Array.from<HTMLInputElement>(
          inputGroup.querySelectorAll("[data-part=input]")
        );
        const input = inputElements[context.focusedIndex];
        requestAnimationFrame(() => {
          input?.focus();
        });
      },
      setPastedValue(context, event) {
        const pastedValue: string[] = event.value
          .split("")
          .slice(0, context.value.length);
        // Can't swap out the entire array because it doesn't preserve empty slots, making length fluctuate from 4
        // context.value = pastedValue;
        pastedValue.forEach((value, index) => {
          context.value[index] = value;
        });
      },
      focusLastEmptyInput(context) {
        const index = context.value.findIndex((value) => value === "");
        const lastIndex = context.value.length - 1;
        context.focusedIndex = index === -1 ? lastIndex : index;
      },
    },
  }
);

/*

TODOs

- [x] hitting backspace on first input changes the value to an empty string, and then moves to the next input. we don't want this behaviour. we want it to not move focus if the value is ""
- [ ] if you go back to an input and add a char it allows two values to exist in the field before moving on, we want it to replace then move on.

*/
