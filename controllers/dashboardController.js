
import mongoose from "mongoose";
import User from '../Model/userModel.js'
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';   

dotenv.config();
const METABASE_SITE_URL = process.env.METABASE_SITE_URL;
const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY;

const DASHBOARD_IDS = {
    Bihar: { voter: 14, media: 12 },
    Delhi: { voter: 14, media: 7 },
    'West Bengal': { voter: 16, media: 13 }
  };

  export const displayDashboard = async (req, res) => {
    const { type } = req.params;
  
    if (!['voter', 'media'].includes(type)) {
      return res.status(400).json({ message: "Invalid dashboard type" });
    }
  
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
  
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    const state = user.state;
    const dashboardId = DASHBOARD_IDS[state]?.[type];
  
    if (!dashboardId) {
      return res.status(404).json({ message: "Dashboard not found for this state and type" });
    }
  
    const payload = {
      resource: { dashboard: dashboardId },
      params: {},
      exp: Math.round(Date.now() / 1000) + (10 * 60),
    };
  
    const token = jwt.sign(payload, METABASE_SECRET_KEY);
    const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`;
  
    res.json({ iframeUrl });
  };
  