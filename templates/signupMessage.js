

const getSignupEmailTemplate = (userName) => {
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
            h3{
            color:rgb(24, 23, 23)
            font-size:20px;
            }
          .highlight {
            color: #ff6600;
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
          <h1>Hi Champion,! 🎉</h1>
          <p>🌟 <b>A warm and heartfelt welcome to the Magnifier Family!</b> ❤️</p>
          <p>
            Congratulations! By joining <b>Web Magnifier</b>, you've taken the first bold step toward making your mark on the world.
            Now, you have access to all the incredible features of our platform, crafted with care and passion -proudly Made in India 🇮🇳 with love ❤️.
          </p>
          <p>
            This is your stage to shine! Share your bold opinions on politics, ignite meaningful conversations, 
            and contribute to building a brighter future in the world's largest democracy.Together, let's create a home for ideas that inspire and empower.
          </p>
          <p>Are you ready to amplify your voice and make an impact? Let's embark on this exciting journey together! 🚀</p>

          <p class="footer">With enthusiasm and pride,</p>
          <h3>The Magnifier Team</h3>



          विषय:
          <hr>
          <h2>विषय: मैग्निफायर में आपका स्वागत है 🌟</h2>
          <p>नमस्ते <b>चैंग्नपयन,</b></p>
          <p>
            मैग्निफायर परिवार में आपका हार्दिक स्वागत है! ❤️
            बधाई हो! वेब मैग्निफायर से जुड़कर, आपने दुनिया पर अपनी छाप छोड़ने की पहली साहसी पहल की है।
          </p>
          <p>
            अब, आप हमारे प्लेटफार्म की सभी अद्भुत सुविधाओं का उपयोग कर सकते हैं, जो प्यार और मेहनत से बनाई गई हैं – 
            गर्व से भारत में निर्मित 🇮🇳 प्यार से ❤️।
          </p>
          <p>यह आपकी चमकने की बेला है! राजनीग्नत पर अपने साहग्नसक ग्नवचार साझा करें, सार्िक बातचीत शुरू करें, और दुग्ननया के सबसे बड़े लोकतंत्र के हृदय में एक उज्ज्वल भग्नवष्य बनाने में योगदान दें। आइए, ग्नमलकर ऐसे ग्नवचारों का घर बनाएं जो प्रेररत करें और सशक्त बनाएं।</p>
          <p>अपनी आवाज़ को मजबूत करने और प्रभाव डालने के लिए तैयार हैं? चलिए, इस रोमांचक यात्रा को शुरू करें!</p>

          <p class="footer">उत्साह और गवि के सार्,,<br/><b>मैविफायर टीम</b></p>
        </div>
      </body>
    </html>
    `;
};

export default getSignupEmailTemplate;
