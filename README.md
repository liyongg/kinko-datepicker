# kinko-datepicker

An interface for selecting enabling and disabling dates.

## Setup

When encountering problems, make sure to check for the following

1.  Domain provider IP-whitelist\
    When problems arise from the ISP side, it is likely that the designated public IP address changes. Navigate to website of the domain provider and change or add the newly designated public IP. This allows a connection through SFTP.

2.  PM2 list\
    If the backend process is not running anymore, make sure to navigate to the backend folder and then run.\
    `pm2 start server.js --name kinko`

3.  Permissions\
    Check whether there are conflicting `pm2` services running at the same time, but on different accounts. As of now, the service is run as root user, and trying to run it as another user as well will cause conflicts for the backend.

## To-Do

1.  Make a GitHub Actions prompt to automatically pull changes to the server.
2.  Edit dateslist for a better organised view.
