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
        const eventValue: string = event.value;
        const focusedValue = context.value[context.focusedIndex];
        const updatedValue = resolveValueUpdate(focusedValue, eventValue);
        // probably a better name for this function os const updatedValue = resolveValueUpdate

        // setting the focused value means updating the value array. with the value in the correlating input
        // to do that we need to take the value and put it in the right place, so we need the index.
        context.value[context.focusedIndex] = updatedValue;
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

// UTILITY FUNCTIONS

// "2" , "22" => "2"
function resolveValueUpdate(focusedValue: string, eventValue: string) {
  let updatedValue = eventValue;
  if (focusedValue.charAt(0) === eventValue.charAt(0)) {
    // this rule deals with both these cases:
    // "2" , "29" => "9"
    // "2" , "22" => "2" -> we don't need to define this case because changes only need to occure if the eventValue has a unique second char, otherwise we can make the decision that charAt(1) is the right value even thos we don't know what it is. it can be 2 it can be 9, but we don't need to know.

    updatedValue = eventValue.charAt(1);
    // this might seem confusing but we assume the theres currently 2 chars in the inputs value, so zero should match
  } else if (focusedValue.charAt(0) === eventValue.charAt(1)) {
    updatedValue = eventValue.charAt(0);
  }

  return updatedValue;
}
