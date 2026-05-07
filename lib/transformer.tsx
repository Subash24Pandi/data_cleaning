export const transformData = (data: any[], mapping: any, defaultCountry: string = '+91') => {
  return data.map((row: any) => {
    const newRow = { ...row };

    if (mapping.firstName && newRow[mapping.firstName]) {
      const words = String(newRow[mapping.firstName]).trim().split(/\s+/);
      const callingName = words.find(w => w.length > 2) || words[0];
      newRow[mapping.firstName] = String(callingName).toLowerCase();
    }

    if (mapping.email && newRow[mapping.email]) {
      newRow[mapping.email] = String(newRow[mapping.email]).toLowerCase().trim();
    }

    if (mapping.phone && newRow[mapping.phone]) {
      let rawPhone = String(newRow[mapping.phone]).split(/[,/;\n]/)[0].trim();
      
      let codeToUse = defaultCountry;
      if (mapping.countryCode && newRow[mapping.countryCode]) {
        let code = String(newRow[mapping.countryCode]).trim();
        if (!code.startsWith('+')) {
          code = '+' + code.replace(/[^0-9]/g, '');
        }
        if (code.length > 1) {
           codeToUse = code;
        }
      }

      // 1. Extract only digits
      let digits = rawPhone.replace(/[^0-9]/g, '');
      
      // 2. Omit (remove) any existing country code if it's present
      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2); // India
      else if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);  // US/Canada
      else if (digits.length === 12 && digits.startsWith('44')) digits = digits.slice(2); // UK
      else if (digits.length === 11 && digits.startsWith('61')) digits = digits.slice(2); // Australia
      else if (digits.length === 12 && digits.startsWith('971')) digits = digits.slice(3); // UAE
      else if (digits.length === 10 && digits.startsWith('65')) digits = digits.slice(2); // Singapore (8 digits)
      else if (digits.length === 11 && digits.startsWith('60')) digits = digits.slice(2); // Malaysia (9 digits)
      else if (digits.length === 12 && digits.startsWith('966')) digits = digits.slice(3); // Saudi Arabia (9 digits)
      else if (digits.length === 11 && digits.startsWith('27')) digits = digits.slice(2); // South Africa (9 digits)
      else if (digits.length > 10) digits = digits.slice(-10); // Fallback: Take last 10 digits
      
      // 3. Remove any leading zeros (e.g. 07911123456 -> 7911123456)
      digits = digits.replace(/^0+/, '');

      // 4. Forcefully apply the chosen country code
      if (digits.length > 0) {
        newRow[mapping.phone] = `${codeToUse}${digits}`;
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