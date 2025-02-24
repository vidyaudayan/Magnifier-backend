const getLoginEmailTemplate = (userName) => {
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
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
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
          h3 {
            color: rgb(24, 23, 23);
            font-size: 20px;
          }
          span {
            font-weight: bold;
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
          <h1>Hi Champion! 🎉</h1>
          <p>🌟 <b>Welcome to the Magnifier Family!</b> ❤️</p>
          <p>
            Congratulations! By signing up for <b>Web Magnifier</b>, you've taken the first step toward world domination.
            Now, you can access all the features of our platform, specially designed for YOU – proudly Made in India 🇮🇳 with love ❤️.
          </p>
          <p>
            Let’s show the world how amazing you are! Share your opinions on politics, spark meaningful conversations,
            and help build a thought of home in the lap of the world’s mother of democracy.
          </p>
          <p>Ready to magnify your voice? Let’s get started! 🚀</p>
          <p class="footer">Best regards,</p>
          <h3>The Magnifier Team</h3>
          <hr>
          <h2>नमस्ते चैंग्नपयन,</h2>
          <p>मैग्निफायर परिवार में आपका स्वागत है! ❤️</p>
          <p>
            बधाई हो! वेब मैग्निफायर के ग्नलए साइन अप करके, आपने ग्नवश्व ग्नवजय की ग्नदशा में पहला कदम बढा ग्नदया है।
          </p>
          <p>
            अब आप हमारे प्लेटफॉमि की सभी सुग्नवधाओं का उपयोग कर सकते हैं, जो ग्नवशेष रूप से आपके ग्नलए बनाई गई हैं –
            भारत में बनाया गया 🇮🇳, प्यार से ❤️।
          </p>
          <p>
            आइए दुग्ननया को ग्नदखाएं ग्नक आप ग्नकतने अद्भुत हैं! राजनीग्नत पर अपनी राय साझा करें, सार्िक बातचीत शुरू करें,
            और लोकतंत्र की जननी कहलाने वाली इस दुग्ननया की गोद में एक ग्नवचारशील घर बनाने में मदद करें।
          </p>
          <p>अपनी आवाज़ को मजबूत करने के ग्नलए तैयार हैं? आइए शुरू करें!</p>
          <p class="footer">सादर,</p>
          <h3>मैग्निफायर टीम</h3>
        </div>
      </body>
    </html>
    `;
};

export default getLoginEmailTemplate;
