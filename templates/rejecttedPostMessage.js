const getPostRejectionEmailTemplate = (userName) => {
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
            color: #d9534f;
            text-align: center;
          }
          p {
            color: #333;
            font-size: 16px;
          }
          .button {
            background-color: #f0ad4e;
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
          <h1>Hi ${userName}!</h1>
          <p>Thank you for sharing your thoughts on Magnifier! ✨</p>
          <p>After careful review, we noticed that your post doesn’t fully align with our <b> community guidelines </b>. But don’t worry – this is just a small bump on the road to making your voice heard!</p>
          
          <h3>📌 Here's what you can do next:</h3>
          <ul>
            <li>Review our <a href="https://magnifyweb.netlify.app/userguidelines" target="_blank">Community Guidelines</a> to understand what we look for in posts.</li>
            <li>Make the necessary edits to your post to ensure it’s meaningful, respectful, and engaging.</li>
            <li>Repost your updated content – we can’t wait to see it!</li>
          </ul>
          <p>Let’s work together to make your next post a success. We’re rooting for you!</p>
         <p class="footer">Warm regards,<br/><b>The Magnifier Team</b></p>
          
          <hr>
          <p>आइए आपकी पोस्ट को और बेहतर बनाएं – आप लगभग पहंच गए हैं! 🚀</p>
          
          <h1>नमस्ते, ${userName}!</h1>
          <p>मैग्निफायर पर अपने विचार साझा करने के लिए धन्यवाद! ✨</p>
          <p>सावधानीपूविक समीक्षा के बाद, हमने देखा ग्नक आपकी पोस्ट हमारे <b>कम्युविटी वदशाविदेशोों </b> के सार् पूरी तरह से मेल नहीं खाती है। लेग्नकन ग्नचंता न करें – यह आपकी आवाज़ को सुनाने के रास्ते में एक छोटी सी बाधा है!</p>

          <h3>📌 आगे क्या करें:</h3>
          <ul>
            <li>हमारे <a href="https://magnifyweb.netlify.app/userguidelines" target="_blank">सामुदायिक दिशानिर्देश</a> पढ़ें ताकि आप समझ सकें कि हम पोस्ट में क्या देखते हैं।</li>
            <li>अपनी पोस्ट में आवश्यक सुधार करें ताकि यह अधिक सार्थक, सम्मानजनक और आकर्षक बन सके।</li>
            <li>अपनी अपडेटेड पोस्ट को फिर से सबमिट करें – हम इसे देखने के ग्नलए उत्सुक हैं!</li>
          </ul>
          <p>याद रखें, हर महान ग्नवचार दूसरे मौके का हकदार है। आपकी आवाज़ मायने रखती है, और हम आपको चमकने में मदद करने के ग्नलए यहां हैं! ✨</p>
          <p>आइए ग्नमलकर आपकी अगली पोस्ट को सफल बनाएं। हम आपके सार् हैं!</p>

          <p class="footer">सादर,<br/><b>मैग्निफायर टीम</b></p>
        </div>
      </body>
    </html>
    `;
};

export default getPostRejectionEmailTemplate;
