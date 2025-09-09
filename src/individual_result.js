result = (rr, ei) =>
  $.ajax({
    url: "https://ducmc.com/ajax/get_program_by_exam.php?=",
    method: "POST",
    // timeout: 0,
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.5", // this changes every time
    },
    data: {
      reg_no: "" + (rr + 9775),
      pro_id: "1",
      sess_id: "20",
      exam_id: ei,
      // 726, 3rd prof nov 2023
      // 725, 2nd prof nov 2023 (ylma)
      // 365, 2nd prof nov 2022
      // 1.4, 1st prof may 2021
      //
      gdata: "99",
    },
    success: (r) => {
      console.log(
        rr + resultStatus((resultText = $($.parseHTML(r))[0].innerText)),
      );
      // console.log(r)
      document.body.innerHTML = r;
    },
  });
resultStatus = (resultText) => {
  // if (resultText==' This is not verifyed for this exam. ') {return resultText};
  // if (resultText==' Results were not published. ') {return resultText};
  try {
    const regexPassed = /Passed(.*)/;
    const regexReferred = /Referred(.*)/;
    const matchPassed = resultText.match(regexPassed);
    const regexStudentsName = /(?<=Student's Name)(.*)(?=Registration)/;
    const studentsName = resultText.match(regexStudentsName)[0].trim();
    const regexClassRoll = /(?<=Class Roll)(.*)(?=Exam Year)/;
    const classRoll = resultText.match(regexClassRoll)[0].trim();
    const regexExamRoll = /(?<=Exam Roll)(.*)(?=Class Roll)/;
    const examRoll = resultText.match(regexExamRoll)[0].trim();
    const particulars = `roll :${classRoll} ${studentsName}`;
    if (matchPassed) {
      const passedSubjects = matchPassed[1].trim();
      return `  ${particulars}  , exam roll : ${examRoll} Passed ${passedSubjects}`;
    }
    const matchReferred = resultText.match(regexReferred);
    if (matchReferred) {
      const referredSubjects = matchReferred[1].trim();
      return `  ${particulars}  , exam roll : ${examRoll} Referred: ${referredSubjects}`;
    }
  } catch {
    return resultText;
  }
};

result(110, 725);