import { createSignal } from "solid-js";
import logo from "./assets/logo.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [rollNumber, setRollNumber] = createSignal("");
  const [result, setResult] = createSignal("");
  const [name, setName] = createSignal("---");
  const [examRoll, setExamRoll] = createSignal("---");
  const [resultStatus, setResultStatus] = createSignal("---");
  const [resultColor, setResultColor] = createSignal("");
  const [messegeColor, setMessegeColor] = createSignal("");
  const [profNumber, setProf] = createSignal(1.4);
  const [loadDash, setLoadDash] = createSignal("");

  async function fetchResult() {
    console.log("in fetch result");
    setName(loadDash());
    setExamRoll(loadDash());
    setResultStatus(loadDash());
    setResult(loadDash());
    setResultColor("");
    setMessegeColor("");

    try {
      const r = parseInt(rollNumber()) + 9775;
      const rr = r.toString();
      const resultTextHTML = await invoke("fetch_result", {
        rollNumber: rr,
        examId: profNumber().toString(),
      });
      const parseHTMLToText = (htmlString) => {
        const parser = new DOMParser();
        const parsedDocument = parser.parseFromString(htmlString, "text/html");
        return parsedDocument.body.textContent;
      };
      const resultText = parseHTMLToText(resultTextHTML);
      setResult(resultText);
      const regexPassed = /Passed(.*)/;
      const regexReferred = /Referred(.*)/;
      const matchPassed = resultText.match(regexPassed);
      const studentsName = resultText
        .match(/(?<=Student's Name)(.*)(?=Registration)/)[0]
        .trim();
      const classRoll = resultText
        .match(/(?<=Class Roll)(.*)(?=Exam Year)/)[0]
        .trim();
      const examRoll = resultText
        .match(/(?<=Exam Roll)(.*)(?=Class Roll)/)[0]
        .trim();
      const particulars = `Roll: ${classRoll} | Name: ${studentsName}`;
      setName(studentsName);
      setExamRoll(examRoll);
      if (matchPassed) {
        const passedSubjects = matchPassed[1].trim();
        setResult(
          `${particulars}, Exam Roll: ${examRoll} Passed: ${passedSubjects}`,
        );
        setResultStatus("Passed");
        setResultColor("green");
      } else {
        const matchReferred = resultText.match(regexReferred);
        if (matchReferred) {
          const referredSubjects = matchReferred[1].trim();
          setResult(
            `${particulars}, Exam Roll: ${examRoll} Referred: ${referredSubjects}`,
          );
          setResultStatus("Referred: " + referredSubjects);
          setResultColor("Red");
        } else {
          setResult(resultText);
        }
      }
    } catch (error) {
      console.error("Error fetching result:", error);
      setMessegeColor("purple");
      // setResult(resultText);
    }
  }

  return (
    <div>
      (1.4)
      <div
        style={{
          display: "row",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        {/* // 726, 3rd profNumber nov 2023
          // 725, 2nd profNumber nov 2023 (ylma)
          // 365, 2nd profNumber nov 2022
          // 1.4, 1st profNumber may 2021 */}
        <button
          style={{ background: profNumber() === 1.4 ? "green" : "" }}
          onClick={() => {
            setProf(1.4);
          }}
        >
          1st Prof
        </button>
        <button
          style={{ background: profNumber() === 365 ? "green" : "" }}
          onClick={() => setProf(365)}
        >
          2nd Prof
        </button>
        <button
          style={{ background: profNumber() === 726 ? "green" : "" }}
          onClick={() => setProf(726)}
        >
          3rd Prof
        </button>
        <button
          style={{
            background: profNumber() === 4 ? "green" : "",
          }}
          onClick={() => setProf(4)}
        >
          4th Prof
        </button>
      </div>
      <p> </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          let dash = ["-", "--", "---"];
          let index = 0;

          let countDown = () => {
            let seconds = 15; // Seconds upto which one fetch is given time
            const timer = setInterval(() => {
              console.log(dash[index]);
              setLoadDash(dash[index]);
              index = (index + 1) % dash.length;
              seconds--;
              if (seconds <= 0 || name()) {
                clearInterval(timer);
              }
              if (seconds <= 0 && !name()) {
                clearInterval(timer);
                setResult("Timed Out, Checking again..");
                requestFunction();
              }
            }, 1000);
          };

          let requestFunction = async () => {
            countDown();
            setTimeout(() => {
              fetchResult();
            }, 10); // Simulating 10 seconds delay for fetchResult() to complete
          };

          requestFunction();
        }}
      >
        {" Roll Number "}
        <input
          onInput={(e) => setRollNumber(e.currentTarget.value)}
          value={rollNumber()}
          autofocus="autofocus"
          // placeholder="Roll Number"
        />
        <button style={{ background: "orange" }} type="submit">
          Check
        </button>
      </form>
      {/* <div innerHTML={result()}></div> */}
      <div style={{ background: resultColor() }}>
        <div style={{ background: messegeColor() }}>
          <p>Roll Number: {rollNumber()}</p>
          <ul>{result()}</ul>
          <ul>Name : {!name() ? loadDash() : name()}</ul>
          <ul>Exam Roll : {!examRoll() ? loadDash() : examRoll()}</ul>
          <ul>Result : {!resultStatus() ? loadDash() : resultStatus()}</ul>
        </div>
      </div>
    </div>
  );
}

export default App;