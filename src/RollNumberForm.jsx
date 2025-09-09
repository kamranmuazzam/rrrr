
import { createSignal } from "solid-js";

export default function RollNumberForm({
  rollNumber,
  setRollNumber,
  onSubmit,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {" Roll Number "}
      <input
        onInput={(e) => setRollNumber(e.currentTarget.value)}
        value={rollNumber()}
        autofocus="autofocus"
      />
      <button style={{ background: "orange" }} type="submit">
        Check
      </button>
    </form>
  );
}