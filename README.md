# kinko-datepicker

An interface for enabling and disabling dates, specifically for [kinko.nl](https://kinko.nl/reserveren).
As far as I know there is no easy way to disable dates for the `flatpickr` instances that are used by the *Avada Forms* on Wordpress websites.
Therefore I created a simple interface, to avoid having to manually enter the file server and make (hardcoded) changes to the `flatpickr.js` file(s).

## Example

https://github.com/liyongg/kinko-datepicker/assets/44399190/aa979c85-a1b3-4358-8454-bef30383c908

## Troubleshooting

When encountering problems, make sure to check for the following

1.  Domain provider IP-whitelist\
    When problems arise from the ISP side, it is likely that the designated public IP address changes.
    Navigate to website of the domain provider and change or add the newly designated public IP.
    This allows a connection through SFTP and or SSH.

2.  PM2 list\
    If the backend process is not running anymore, make sure to navigate to the backend folder and then run.\
    `pm2 start server.js --name kinko`

3.  Permissions\
    Check whether there are conflicting `pm2` services running at the same time, but on different accounts.
    As of now, the service is run as personal user, and trying to run it as another user as well will cause conflicts for the backend.
