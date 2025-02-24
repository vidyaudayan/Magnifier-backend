const getPostCreationEmailTemplate = (userName) => {
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
            text-align: center;
            padding: 20px;
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
            color: #007bff;
            text-align: center;
          }
          p {
            color: #333;
            font-size: 16px;
          }
          .highlight {
            font-weight: bold;
            color: #007bff;
          }
          .button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
          }
          .footer {
            font-size: 14px;
            color: gray;
            text-align: center;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
        <p> Hi  ${userName}</p>
          <h1>✨ Thank You for posting on Magnifier! ✨</h1>
          <p>🎉 Your thoughts are now in the <span class="highlight">spotlight 🎯</span>!</p>
          <p>Our advanced AI models and expert team are reviewing your post to ensure it’s polished, meaningful, and ready to shine.</p>
          
          <h3>📌Here’s What’s next?</h3>
          <ul>
            <li>Your post will be live in <strong>20-25 minutes</strong> after approval.</li>
            <li>Once live, your voice will reach thousands of like-minded individuals ready to engage and inspire!</li>
          </ul>

          <p>We’re thrilled to have you as part of our community. Keep sharing your bold ideas and sparking conversations that matter! 🚀</p>
        <p>Stay tuned – your post is about to make waves! 🌊</p>

          <p class="footer">Warm regards,<br/><b>The Magnifier Team</b></p>
        </div>

        <div class="container">
          <h1>विषय: आपकी आवाज़ महत्वपूर्ि है – शेयर करने के लिए धन्यवाद! 🌟</h1>
         <p>नमस्ते  ${userName},</p>
         
          <p>✨ <b>मैग्निफायर</b> पर पोस्ट करने के लिए धन्यवाद! ✨</p>
          <p>आपके विचार अब <span class="highlight">स्पॉटलाइट</span> में हैं! 🎯</p>
          <p>हमारी उन्नत AI मॉडल और ग्नवशेषज्ञ टीम आपकी पोस्ट को सही, सार्िक और चमकने के ग्नलए तैयार करने के ग्नलए जांच कर रहे हैं।</p>

          <h3>📌 आगे क्या होगा?</h3>
          <ul>
            <li>आपकी पोस्ट को मंजूरी मिलने के बाद <strong>20-25 मिनट</strong> में लाइव कर दिया जाएगा।</li>
            <li>एक बार लाइव होने के बाद, आपकी आवाज़ हजारों ग्नवचारशील लोगों तक पहंचेगी, जो आपसे जुड़ने और प्रेररत होने के ग्नलए तैयार हैं!</li>
          </ul>

          <p>आपको हमारे समुदाय का ग्नहस्सा बनकर बहत खुशी हो रही है। अपने साहग्नसक ग्नवचारों को साझा करते रहें और ऐसी बातचीत शुरू करें जो मायने रखती हो! 🚀</p>

         <p>तैयार रहें – आपकी पोस्ट चचाि का ग्नवषय बनने वाली है! 🌊</p>

          <p class="footer">सादर,<br/><b>मैग्निफायर टीम</b></p>
        </div>
      </body>
    </html>
    `;
};

export default getPostCreationEmailTemplate;
