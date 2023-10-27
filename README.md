# kinko-datepicker

An interface for selecting enabling and disabling dates.

## Setup

When encountering network problems, make sure to check for the following

1.  Domain provider IP-whitelist\
    When problems arise from the ISP side, it is likely that the designated public IP address changes. Navigate to website of the domain provider and change or add the newly designated public IP. This allows a connection through SFTP.

2.  PM2 list\
    If the backend process is not running anymore, make sure to navigate to the backend folder and then run.\
    `pm2 start server.js --name kinko`
