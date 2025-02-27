import Slot from "../Model/slotModel.js"; 

export const generateSlotsForDay = async () => {
    const existingSlots = await Slot.countDocuments();
    if (existingSlots > 0) return; // If slots exist, don't create new ones

    let slots = [];
    for (let hour = 0; hour < 24; hour++) {
        slots.push({ hour, booked: false });
    }

    await Slot.insertMany(slots);
    console.log("✅ 24 slots generated for the full day!");
};



