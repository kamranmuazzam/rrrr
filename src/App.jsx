import { createSignal, onCleanup } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [results, setResults] = createSignal([]);
  const [profNumber, setProf] = createSignal(1340);
  const [status, setStatus] = createSignal("Idle...");
  const [polling, setPolling] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [countdown, setCountdown] = createSignal(0);
  const [manualRoll, setManualRoll] = createSignal("");
  const [manualResult, setManualResult] = createSignal(null);
  const [mode, setMode] = createSignal("menu"); // "menu" | "manual" | "bulk"
  const [manualPolling, setManualPolling] = createSignal(false);

  const MAX_ROLL = 120;

  // -------------------------
  // Helper: Parse HTML result
  // -------------------------
  const parseHTMLToText = (htmlString) => {
    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(htmlString, "text/html");
    return parsedDocument.body.textContent;
  };

  // -------------------------
  // Fetch with Timeout
  // -------------------------
  async function invokeWithTimeout(rollNumber, examId, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout")), timeoutMs);

      invoke("fetch_result", { rollNumber, examId })
        .then((res) => {
          clearTimeout(timeout);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
    });
  }

  // -------------------------
  // Core: Fetch single roll
  // -------------------------
  async function fetchResultSingle(rollNumber) {
    try {
      const r = parseInt(rollNumber) + 9775;
      const rr = r.toString();

      const resultTextHTML = await invokeWithTimeout(rr, profNumber().toString(), 5000);
      const resultText = parseHTMLToText(resultTextHTML);

      if (resultText.trim() === "Results were not published.") {
        return { status: "NOT_PUBLISHED" };
      }

      const regexPassed = /Passed(.*)/;
      const regexReferred = /Referred(.*)/;
      const matchPassed = resultText.match(regexPassed);
      const studentsName = resultText.match(/(?<=Student's Name)(.*)(?=Registration)/)[0].trim();
      const classRoll = resultText.match(/(?<=Class Roll)(.*)(?=Exam Year)/)[0].trim();
      const examRoll = resultText.match(/(?<=Exam Roll)(.*)(?=Class Roll)/)[0].trim();

      let resultObj = { roll: classRoll, examRoll, name: studentsName, result: "", color: "" };

      if (matchPassed) {
        resultObj.result = "Passed " + matchPassed[1].trim();
        resultObj.color = "lightgreen";
      } else {
        const matchReferred = resultText.match(regexReferred);
        if (matchReferred) {
          resultObj.result = "Referred " + matchReferred[1].trim();
          resultObj.color = "salmon";
        } else {
          resultObj.result = resultText;
        }
      }
      return resultObj;
    } catch (err) {
      console.error("Error fetching:", err);
      return { status: "ERROR", msg: err.message };
    }
  }

  // -------------------------
  // Wait + Animate Progress
  // -------------------------
  async function waitWithProgress(ms = 10000) {
    setProgress(0);
    setCountdown(ms / 1000);
    const steps = 100;
    const interval = ms / steps;
    return new Promise((resolve) => {
      let current = 0;
      const timer = setInterval(() => {
        current++;
        setProgress((current / steps) * 100);
        setCountdown(Math.max(0, Math.ceil(((steps - current) * interval) / 1000)));
        if (current >= steps) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
      onCleanup(() => clearInterval(timer));
    });
  }

  // -------------------------
  // Bulk Mode Polling
  // -------------------------
  async function waitForResults() {
    setStatus("🔍 Checking for publication...");
    setPolling(true);

    while (true) {
      const res = await fetchResultSingle(1);
      if (res.status === "NOT_PUBLISHED") {
        setStatus("⏳ Results not published yet. Waiting...");
        await waitWithProgress(10000);
      } else if (res.status === "ERROR") {
        setStatus("⚠️ Error fetching result. Retrying...");
        await waitWithProgress(10000);
      } else {
        setStatus("📢 Results published! Fetching all...");
        break;
      }
    }
    setPolling(false);
  }

  // Bulk Results
  async function fetchAllResults() {
    setResults([]);
    const batchSize = 10;
    for (let i = 1; i <= MAX_ROLL; i += batchSize) {
      const batch = [];
      for (let j = i; j < i + batchSize && j <= MAX_ROLL; j++) batch.push(fetchResultSingle(j));
      const batchResults = await Promise.all(batch);
      setResults((prev) => [...prev, ...batchResults.filter((r) => !r.status)]);
      setStatus(`📥 Fetched ${Math.min(i + batchSize - 1, MAX_ROLL)} of ${MAX_ROLL}`);
    }
    setStatus("✅ All results fetched!");
  }

  async function startProcess() {
    await waitForResults();
    await fetchAllResults();
  }

  // -------------------------
  // Manual Polling Loop
  // -------------------------
  async function checkManualRollLoop() {
    if (!manualRoll()) return;
    setManualPolling(true);

    while (manualPolling()) {
      setStatus(`🔍 Checking Roll ${manualRoll()}...`);
      const res = await fetchResultSingle(manualRoll());

      if (res.status === "NOT_PUBLISHED") {
        setStatus("⏳ Result not published yet. Retrying...");
        await waitWithProgress(10_000);
      } else if (res.status === "ERROR") {
        setStatus("⚠️ Error fetching. Retrying...");
        await waitWithProgress(10_000);
      } else {
        setManualResult(res);
        setStatus("✅ Individual result fetched!");
        break; // stop loop once we have result
      }
    }
    setManualPolling(false);
  }

  // -------------------------
  // Reset State
  // -------------------------
  function resetApp() {
    setResults([]);
    setManualResult(null);
    setManualRoll("");
    setStatus("Idle...");
    setProgress(0);
    setCountdown(0);
    setPolling(false);
    setManualPolling(false);
    setMode("menu");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>📘 Exam Results Checker</h2>

      {/* Prof Selection */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setProf(124)} style={{ background: profNumber() === 124 ? "green" : "" }}>1st Prof</button>
        <button onClick={() => setProf(365)} style={{ background: profNumber() === 365 ? "green" : "" }}>2nd Prof</button>
        <button onClick={() => setProf(726)} style={{ background: profNumber() === 726 ? "green" : "" }}>3rd Prof</button>
        <button onClick={() => setProf(1340)} style={{ background: profNumber() === 1340 ? "green" : "" }}>4th Prof</button>
      </div>

      {/* Mode Selection */}
      {mode() === "menu" && (
        <div>
          <button onClick={() => setMode("manual")}>🔎 Check Individual</button>
          <button onClick={() => setMode("bulk")}>🚀 Bulk Check (All)</button>
        </div>
      )}

      {/* Manual Mode */}
      {mode() === "manual" && (
        <div style={{ marginTop: "15px" }}>
          <h3>🔎 Individual Result (auto-retry)</h3>
          <input
            type="number"
            value={manualRoll()}
            onInput={(e) => setManualRoll(e.currentTarget.value)}
            placeholder="Enter Roll (1-120)"
            style={{ marginRight: "10px" }}
          />
          <button onClick={checkManualRollLoop} disabled={manualPolling()}>Start Checking</button>
          <button style={{ marginLeft: "10px", background: "lightgray" }} onClick={resetApp}>🔄 Reset</button>

          <p>Status: {status()} {manualPolling() && countdown() > 0 && `(retry in ${countdown()}s)`}</p>
          {manualPolling() && (
            <div style={{ border: "1px solid #999", width: "100%", height: "20px", marginTop: "8px", borderRadius: "5px" }}>
              <div
                style={{
                  width: `${progress()}%`,
                  height: "100%",
                  background: "dodgerblue",
                  transition: "width 0.2s linear",
                  borderRadius: "5px"
                }}
              ></div>
            </div>
          )}

          {manualResult() && !manualResult().status && (
            <div style={{ marginTop: "10px", padding: "5px", background: manualResult().color || "#eee" }}>
              <p><strong>Roll:</strong> {manualResult().roll}</p>
              <p><strong>Exam Roll:</strong> {manualResult().examRoll}</p>
              <p><strong>Name:</strong> {manualResult().name}</p>
              <p><strong>Result:</strong> {manualResult().result}</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk Mode */}
      {mode() === "bulk" && (
        <div style={{ marginTop: "15px" }}>
          <h3>🚀 Bulk Result Checker</h3>
          <button onClick={startProcess} disabled={polling()}>Start Auto Checker</button>
          <button style={{ marginLeft: "10px", background: "lightgray" }} onClick={resetApp}>🔄 Reset</button>

          <p>Status: {status()} {polling() && countdown() > 0 && `(retry in ${countdown()}s)`}</p>
          {polling() && (
            <div style={{ border: "1px solid #999", width: "100%", height: "20px", marginTop: "8px", borderRadius: "5px" }}>
              <div
                style={{
                  width: `${progress()}%`,
                  height: "100%",
                  background: "dodgerblue",
                  transition: "width 0.2s linear",
                  borderRadius: "5px"
                }}
              ></div>
            </div>
          )}

          <table border="1" cellPadding="5" style={{ marginTop: "20px", width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Class Roll</th>
                <th>Exam Roll</th>
                <th>Name</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {results().map((r) => (
                <tr style={{ background: r.color || "" }}>
                  <td>{r.roll}</td>
                  <td>{r.examRoll}</td>
                  <td>{r.name}</td>
                  <td>{r.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;