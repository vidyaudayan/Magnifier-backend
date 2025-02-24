const getJobApplicationEmailTemplate = (userName, jobTitle) => {
    if (!userName || !jobTitle) {
        console.error("❌ Missing userName or jobTitle in email template");
        return "<p>Error: Missing user details.</p>";
    }

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
          }
          .container {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            max-width: 600px;
            margin: auto;
            text-align: left;
            line-height: 1.6;
          }
          h1, h2 {
            color: #007bff;
            text-align: center;
          }
          p {
            color: #333;
            font-size: 16px;
          }
          .highlight {
            font-weight: bold;
            color: #ff6600;
          }
          .button {
            display: block;
            width: fit-content;
            margin: 20px auto;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
          }
          .footer {
            text-align: center;
            font-size: 14px;
            color: #777;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${userName},</h1>
          <p>Thank you for applying a job at Magnifier Platform! We’re excited you’re considering joining our mission to amplify voices and empower communities.</p>
          
          <h2>📌 What’s next?</h2>
          <p>1️⃣ Our team will review your application.</p>
          <p>2️⃣ If your skills align with our needs, we’ll contact you for an interview.</p>
          <p>3️⃣ Stay tuned – we’ll keep you updated!</p>
          
          <p>Your talent and passion could be the perfect fit for our growing team. Explore more about us on our <b>Web Magnifier Platform</b>.</p>
          
        <p>Thank you again – we can’t wait to learn more about you!</p>
          <p class="footer">Best regards,<br/><b>The Web Magnifier Team</b></p>

          <hr>

          <h2>विषय: आवेदन करने के लिए धन्यवाद – आइए मिलकर भविष्य बनाएं! 🚀</h2>
          <p>नमस्ते <b>${userName},</b></p>
          <p>मैग्निफायर प्लेटफार्म में आवेदन करने के लिए धन्यवाद! हमें खुशी है कि आप आवाज़ों को मजबूत करने और समुदायों को सशक्त बनाने के हमारे मिशन का हिस्सा बनने पर विचार कर रहे हैं।</p>
          
          <h2>📌 आगे क्या होगा?</h2>
          <p>1️⃣ हमारी टीम आपके आवेदन की समीक्षा करेगी।</p>
          <p>2️⃣ यदि आपके कौशल हमारी आवश्यकताओं से मेल खाते हैं, तो हम आपसे इंटरव्यू के लिए संपर्क करेंगे।</p>
          <p>3️⃣ अपडेट के लिए बने रहें – हम आपको सूचित करते रहेंगे!</p>
          
          <p>आपकी प्रतिभा और जुनून हमारी बढ़ती टीम के लिए एकदम सही हो सकते हैं। हमारे बारे में अधिक जानने के लिए <b>वेब मैग्निफायर प्लेटफार्म</b> पर जाएं।</p>
          

          <p class="footer">सादर,<br/><b>वेब मैग्निफायर टीम</b></p>
        </div>
      </body>
    </html>
    `;
};

export default getJobApplicationEmailTemplate;
