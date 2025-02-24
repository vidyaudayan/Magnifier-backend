const getPostLiveEmailTemplate = (userName) => {
    if (!userName) {
        console.error("❌ Missing userName in email template");
        return "<p>Error: Missing user name.</p>";
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
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: auto;
            text-align: left;
            line-height: 1.6;
          }
          h1 {
            color: #28a745;
            text-align: center;
          }
          p {
            color: #333;
            font-size: 16px;
          }
          .button {
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
            font-size: 16px;
          }
          .highlight {
            font-weight: bold;
            color: #28a745;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hi ${userName}</h1>
          <p>🎉 Great News! Your post is now <span class="highlight">live</span> on <b>Magnifier</b> and ready to inspire, engage, and spark conversations!</p>
          <p>
            Your voice is now part of a vibrant community of thinkers, creators, and changemakers.
            Here’s how you can make the most of it:
          </p>
          <ul>
            <li>📢 <b>Share</b> your post with friends and followers to spread the word.</li>
            <li>💬 <b>Engage</b> with comments – your insights matter!</li>
            <li>🔥 <b>Stay active</b> – keep sharing bold ideas and inspiring others.</li>
          </ul>
          <p>Thank you for being a part of <b>Magnifier</b>. Together, we’re building a platform where <b>every voice matters</b>! 🚀</p>
         
          <p>Keep shining,<br/><b>The Magnifier Team</b></p>
        </div>


        <div class="container">
          <h1>विषय: आपकी पोस्ट लाइव है – दुग्ननया को आपकी आवाज़ सुनने दें! 🌍✨</h1>
         <p>नमस्ते  ${userName},</p>
         
          <p>🎉 बड़ी खुशखबरी! आपकी पोस्ट अब मैग्निफायर पर लाइव है और लोगों को प्रेररत करने, जोड़ने और बातचीत शुरू करने के ग्नलए तैयार है!</p>
          <p>आपकी आवाज़ अब ग्नवचारशील, रचनात्मक और बदलाव लाने वाले लोगों के एक जीवंत समुदाय का ग्नहस्सा है। इसे और बेहतर बनाने के ग्नलए आप यह कर सकते हैं:</p>

         
          <ul>
            <li>अपनी पोस्ट को दोस्तों और फॉलोअसि के सार् <b> शेयर करें </b> ताग्नक यह और लोगों तक पहंचे।</li>
            <li><b>कमेंट्स में शावमि होों </b> – आपके ग्नवचार महत्वपूर्ि हैं!</li>
          <li> <b>सक्रीय  रहें</b> – अपने साहग्नसक ग्नवचारों को साझा करते रहें और दूसरों को प्रेररत करें।</li>
            </ul>

          <p>मैग्निफायर का ग्नहस्सा बनने के ग्नलए धन्यवाद। हम ग्नमलकर एक ऐसा मंच बना रहे हैं जहां हर आवाज़ मायने रखती है! 🚀</p>


          <p class="footer">चमकते रहें,<br/><b>मैग्निफायर टीम</b></p>
        </div>
      </body>
    </html>
    `;
};

export default getPostLiveEmailTemplate;
