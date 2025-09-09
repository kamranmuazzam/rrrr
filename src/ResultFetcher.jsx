import { createSignal } from "solid-js";

function ResultFetcher(props) {
  const [rollNumber, setRollNumber] = props.setRollNumber;
  const [profNumber, setProf] = createSignal(1.4);
  const [name, setName] = props.setName;
  const [examRoll, setExamRoll] = props.setExamRoll;
  const [result, setResult] = props.setResult;
  const [resultStatus, setResultStatus] = props.setResultStatus;
  const [resultColor, setResultColor] = props.setResultColor;
  const [messageColor, setMessageColor] = props.setMessageColor;

  async function fetchResult() {
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
      setMessageColor("purple");
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchResult();
  };

  return (
    <form onSubmit={handleSubmit}>
      {" Roll Number "}
      <input
        onInput={(e) => setRollNumber(e.currentTarget.value)}
        value={rollNumber()}
        autoFocus="autofocus"
      />
      <button style={{ background: "orange" }} type="submit">
        Check
      </button>
    </form>
  );
}

export default ResultFetcher;