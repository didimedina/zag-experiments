import { useMachine } from "@zag-js/react";
import { machine } from "./machines/pin-input";

const inputs = [...Array.from({ length: 4 }).keys()];

function App() {
  const [state, send] = useMachine(machine);

  const { value } = state.context;

  return (
    <>
      <div
        data-part="container"
        className="max-w-md mx-auto flex flex-col gap-4"
      >
        <label>Enter verification</label>
        <div data-part="input-group" className="flex gap-2 justify-center">
          {inputs.map((index) => (
            <input
              data-part="input"
              maxLength={2}
              key={index}
              value={value[index]}
              onChange={(event) => {
                const { value } = event.target;
                send({ type: "INPUT.CHANGE", index, value });
              }}
              onFocus={() => {
                send({ type: "INPUT.FOCUS", index });
              }}
              onBlur={() => {
                send({ type: "INPUT.BLUR" });
              }}
              onKeyDown={(event) => {
                const { key } = event;
                if (key === "Backspace") {
                  send({ type: "INPUT.BACKSPACE", index });
                }
              }}
              onPaste={(event) => {
                event.preventDefault();
                const value = event.clipboardData.getData("Text").trim();
                send({ type: "INPUT.PASTE", value, index });
              }}
              data-part="input"
              className="block w-full text-center aspect-square rounded-xl bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          ))}
        </div>
        <pre>{stringify(state)}</pre>
      </div>
    </>
  );
}

function stringify(state: Record<string, any>) {
  const { value, event, context } = state;
  return JSON.stringify({ state: value, event, context }, null, 2);
}

export default App;
