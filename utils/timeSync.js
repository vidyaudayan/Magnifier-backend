import ntpClient from 'ntp-client';

export const syncTime = async () => {
  try {
    const ntpServer = 'time.google.com';
    const ntpPort = 123;

    await new Promise((resolve, reject) => {
      ntpClient.getNetworkTime(ntpServer, ntpPort, (err, date) => {
        if (err) {
          console.error('NTP sync error:', err);
          reject(err);
        } else {
          console.log('NTP synchronized time:', date);
          resolve(date);
        }
      });
    });
  } catch (error) {
    console.error('Time synchronization failed:', error);
  }
};
   