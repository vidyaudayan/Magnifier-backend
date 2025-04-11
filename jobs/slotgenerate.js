import Slot from "../Model/slotModel.js"; 


{/*
export const generateSlotsForDay = async () => {
    try {
      // Clear existing slots if needed
      await Slot.deleteMany({});
      
      const durations = [
        { duration: 1, interval: 1 },
        { duration: 3, interval: 3 },
        { duration: 6, interval: 6 },
        { duration: 12, interval: 12 }
      ];
  
      const slotsToInsert = [];
  
      for (const { duration, interval } of durations) {
        for (let hour = 0; hour < 24; hour += interval) {
            if (hour + duration <= 24) {
            slotsToInsert.push({
            hour, // Using hour instead of startHour to match your schema
            duration,
            startHour: hour ,
            endHour: hour + duration,
            type: `${duration}-hour`,
            booked: false
          });
        }
        }
      }
  
      // Insert all slots in one operation
      await Slot.insertMany(slotsToInsert);
      console.log(`✅ Successfully generated ${slotsToInsert.length} slots`);
  
    } catch (error) {
      console.error('Error generating slots:', error);
      throw error;
    }
  };*/}


  {/*export const generateSlotsForDay = async () => {
    const durations = [1, 3, 6, 12];
    const slots = [];
  
    durations.forEach(duration => {
      for (let hour = 0; hour <= 24 - duration; hour++) {
        slots.push({
          hour,
          duration,
          startHour: hour,
          endHour: hour + duration,
          type: `${duration}-hour`,
          booked: false
        });
      }
    });
  
    await Slot.insertMany(slots);
  };*/}


  export const generateSlotsForDay = async () => {
    try {
      await Slot.deleteMany({});
      
      const durations = [1, 3, 6, 12];
      const slots = [];
  
      durations.forEach(duration => {
        // For 1-hour slots, create all 24 slots
        if (duration === 1) {
          for (let hour = 0; hour < 24; hour++) {
            slots.push({
              hour,
              duration,
              startHour: hour,
              endHour: hour + duration,
              type: `${duration}-hour`,
              booked: false
            });
          }
        } 
        // For longer durations, create non-overlapping slots
        else {
          for (let hour = 0; hour < 24; hour += duration) {
            if (hour + duration <= 24) {
              slots.push({
                hour,
                duration,
                startHour: hour,
                endHour: hour + duration,
                type: `${duration}-hour`,
                booked: false
              });
            }
          }
        }
      });
  
      await Slot.insertMany(slots);
      console.log(`Generated ${slots.length} non-overlapping slots`);
    } catch (error) {
      console.error('Error generating slots:', error);
      throw error;
    }
  };