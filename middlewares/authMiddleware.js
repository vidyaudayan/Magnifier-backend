export const authMiddleware1 = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
  
  import jwt from 'jsonwebtoken';   

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
 // console.log("Received Authorization header:", req.headers.authorization);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token is missing or invalid' });
  }  

  const token = authHeader.split(' ')[1]; // Extract the token after 'Bearer'

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key
    req.user = decoded; // Attach the decoded payload to the request
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};


export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
      console.log("Authorization header is missing");
      return res.status(401).json({ message: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1]; // Extract the token
  if (!token) {
      console.log("Bearer token is missing");
      return res.status(401).json({ message: "Malformed token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
          console.log("Token verification failed:", err.message);
          return res.status(403).json({ message: "Invalid token" });
      }

      req.user = user; // Attach user info to the request
      next();
  });
};
