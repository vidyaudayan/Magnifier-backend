

const getSignupEmailTemplate = (userName) => {
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
          .button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome, ${userName}!</h1>
          <p>🎉 We are thrilled to welcome you to <b>Magnifier</b>! 🌟</p>
          <p>
            You’ve taken the first bold step toward making your mark on the world. 
            Now, you have access to all the incredible features of our platform, 
            crafted with care and passion – proudly made in India 🇮🇳 with love ❤️.
          </p>
          <p>
            This is your stage to shine! Share your bold opinions on politics, 
            ignite meaningful conversations, and contribute to building a 
            brighter future in the world’s largest democracy.
          </p>
          <p>
            Ready to amplify your voice and make an impact? 
            Click the button below to get started:
          </p>
          <a href="https://yourwebsite.com" class="button">Get Started</a>
          <p>Best regards,<br/><b>The Magnifier Team</b></p>
        </div>
      </body>
    </html>
    `;
  };
  
  export default getSignupEmailTemplate;
  