export const transformData = (data: any[], mapping: any) => {
  return data.map((row: any) => {
    const newRow = { ...row };

    if (mapping.firstName && newRow[mapping.firstName]) {
      const words = String(newRow[mapping.firstName]).trim().split(/\s+/);
      const callingName = words.find(w => w.length > 2) || words[0];
      newRow[mapping.firstName] = String(callingName).toLowerCase();
    }

    if (mapping.phone && newRow[mapping.phone]) {
      const cleaned = String(newRow[mapping.phone]).replace(/[^0-9]/g, '');
      if (cleaned.length >= 10) {
        newRow[mapping.phone] = `+91${cleaned.slice(-10)}`;
      }
    }

    if (mapping.company && newRow[mapping.company]) {
      newRow[mapping.company] = String(newRow[mapping.company]).toLowerCase()
        .replace(/\b(private limited|pvt ltd|co limited|co ltd|limited|ltd|pvt|co|llp|inc|corp|solutions|services|industries|industry)\b/gi, '')
        .replace(/[^\w\s]/gi, '').trim();
    }

    if (mapping.car && newRow[mapping.car]) {
      newRow[mapping.car] = String(newRow[mapping.car]).toLowerCase().trim();
    }

    return newRow;
  });
};