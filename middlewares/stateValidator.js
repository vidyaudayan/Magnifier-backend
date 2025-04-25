
export const validateState = (req, res, next) => {
    const validStates = ['Delhi', 'Bihar', 'West Bengal'];
    const state = req.body.state || 'Delhi';
    
    if (!validStates.includes(state)) {
      return res.status(400).json({ message: "Invalid state provided" });
    }
    
    req.body.state = state; // Ensure proper case
    next();
  };
  
  