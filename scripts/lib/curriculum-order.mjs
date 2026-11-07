const stageRank = (grade = "") => {
  if (/^primary\\s/i.test(grade)) return 0;
  if (/^preparatory\\s/i.test(grade)) return 1;
  if (/^secondary\\s/i.test(grade)) return 2;
  if (/^baccalaureate\\s/i.test(grade)) return 3;
  return 4;
};

const gradeNumber = (grade = "") => {
  const match = String(grade).match(/\\d+/);
  return match ? Number(match[0]) : 99;
};

const documentRank = (type = "") => ({
  student_book: 0,
  workbook: 0,
  commercial_supplement: 1,
  assessment: 2,
  reader: 3
}[type] ?? 9);

export function compareUnitCandidates(a, b) {
  return stageRank(a.grade) - stageRank(b.grade)
    || gradeNumber(a.grade) - gradeNumber(b.grade)
    || documentRank(a.documentType) - documentRank(b.documentType)
    || String(a.bookId).localeCompare(String(b.bookId))
    || Number(a.unitNumber) - Number(b.unitNumber);
}

export function sortUnitCandidates(candidates = []) {
  return [...candidates].sort(compareUnitCandidates);
}
