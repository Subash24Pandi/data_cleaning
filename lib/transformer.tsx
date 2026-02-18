export const transformData = (data: any[]) => {
  return data.map((row: any) => {
    const values = Object.values(row).map(v => String(v).trim());
    const keys = Object.keys(row);
    
    let rawName = "";
    let rawPhone = "";
    let rawCar = "";

    // 1. Logic to find Phone (10 digits check)
    const phoneMatch = values.find(v => {
      const cleaned = v.replace(/\s+/g, '').replace(/[^0-9]/g, '');
      return cleaned.length >= 10 && cleaned.length <= 13;
    });
    
    // 2. Logic to find Name (Text that is not a phone or car model)
    const nameMatch = values.find(v => {
      const isPhone = v.replace(/[^0-9]/g, '').length >= 10;
      const isCar = ["c3", "i10", "i20", "vitara", "creta"].some(model => v.toLowerCase().includes(model));
      return v.length > 2 && !isPhone && !isCar;
    });

    // 3. Logic to find Car (Model keyword check)
    const carMatch = values.find(v => 
      ["car", "model", "vehicle", "c3", "i10", "i20", "vitara", "creta", "venue", "alcazar"].some(m => v.toLowerCase().includes(m))
    );

    // Header matching (if headers exist)
    const nameKey = keys.find(k => /name|owner|client/i.test(k));
    const phoneKey = keys.find(k => /phone|mobile|number|contact/i.test(k));
    const carKey = keys.find(k => /car|vehicle|model/i.test(k));

    rawName = nameKey ? row[nameKey] : (nameMatch || "");
    rawPhone = phoneKey ? row[phoneKey] : (phoneMatch || "");
    rawCar = carKey ? row[carKey] : (carMatch || "");

    // Final Formatting
    const nameWords = String(rawName).trim().split(/\s+/).filter(w => w.length > 0);
    let firstName = "unknown";
    if (nameWords.length > 0) {
      const firstFullWord = nameWords.find(word => word.length > 2);
      firstName = (firstFullWord ? firstFullWord : nameWords[0]).toLowerCase();
    }

    const cleanedPhone = String(rawPhone).replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const finalPhone = cleanedPhone ? (cleanedPhone.startsWith('91') && cleanedPhone.length > 10 ? `+${cleanedPhone}` : (cleanedPhone.startsWith('+91') ? cleanedPhone : `+91${cleanedPhone}`)) : 'n/a';

    const result: any = {
      "first name": firstName,
      "phone": finalPhone.toLowerCase()
    };

    if (rawCar) {
      const carWords = String(rawCar).trim().split(/\s+/).filter(w => w.length > 0);
      const modelIdx = carWords.findIndex(word => word.length >= 2);
      if (modelIdx !== -1) {
        let model = carWords[modelIdx];
        const next = carWords[modelIdx + 1];
        if (next && (/^\d+$/.test(next) || model.toLowerCase().startsWith("grand"))) {
          model += " " + next;
        }
        result["car"] = model.toLowerCase();
      }
    }

    return result;
  });
};