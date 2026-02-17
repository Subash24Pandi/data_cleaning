export const transformData = (data: any[]) => {
  return data.map((row: any) => {
    const result: any = {};
    const keys = Object.keys(row);

    // --- 1. first name logic (small letters) ---
    // Header search: name, owner, client
    const nameKey = keys.find(k => 
      k.toLowerCase().includes("name") || k.toLowerCase().includes("owner")
    );
    const rawName = nameKey ? row[nameKey] : "";
    const nameWords = String(rawName).trim().split(/\s+/).filter(w => w.length > 0);
    
    if (nameWords.length > 0) {
      // Skips initials (length <= 2) to get the main name
      const firstFullWord = nameWords.find(word => word.length > 2);
      result["first name"] = (firstFullWord ? firstFullWord : nameWords[0]).toLowerCase();
    } else {
      result["first name"] = "unknown";
    }

    // --- 2. phone logic (small letters) ---
    // Header search: mobile, phone, contact, number
    const phoneKey = keys.find(k => 
      k.toLowerCase().includes("mobile") || 
      k.toLowerCase().includes("phone") || 
      k.toLowerCase().includes("number")
    );
    const rawPhone = phoneKey ? row[phoneKey] : "";
    const cleaned = String(rawPhone).replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    
    result["phone"] = (cleaned ? (cleaned.startsWith('+91') ? cleaned : `+91${cleaned}`) : 'n/a').toLowerCase();

    // --- 3. car logic (conditional fetching) ---
    // Header search: car, vehicle, model
    const carKey = keys.find(k => 
      k.toLowerCase().includes("car") || k.toLowerCase().includes("vehicle") || k.toLowerCase().includes("model")
    );

    if (carKey && row[carKey]) {
      const carWords = String(row[carKey]).trim().split(/\s+/).filter(w => w.length > 0);
      const modelIdx = carWords.findIndex(word => word.length >= 2);
      
      if (modelIdx !== -1) {
        let model = carWords[modelIdx];
        const next = carWords[modelIdx + 1];
        // Handles models like "grandI 10", "c3", etc.
        if (next && (/^\d+$/.test(next) || model.toLowerCase().startsWith("grand"))) {
          model += " " + next;
        }
        result["car"] = model.toLowerCase();
      } else {
        result["car"] = carWords[0].toLowerCase();
      }
    }

    return result;
  });
};