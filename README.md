# Monitor

To configure settings you need to set up environment variables for each process.

## Available master settings

| Name   | Example |
|----------|-------------|
| `LOG_LEVEL` | [`LOG_LEVEL_NAME`](#LOG_LEVEL) |
| `INITIAL_DATA_SLOTS` | [`JSON_STRING`](#INITIAL_DATA_SLOTS) |
| `DEFAULT_REFRESH_INTERVAL` | [`0 */5 * * * *`](#REFRESH_INTERVAL)
| `SLACK_REFRESH_INTERVAL` | [`0 */59 * * * *`](#REFRESH_INTERVAL)
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...`
| `TRANSPORT_ADDONS` | `./transport/mail.js;./transport/slack.js`
| `EMAIL_REFRESH_INTERVAL` | [`0 */20 * * * *`](#REFRESH_INTERVAL)
| `EMAIL_CONFIG_transport_service` | `gmail`
| `EMAIL_CONFIG_transport_auth_user` | `***`
| `EMAIL_CONFIG_transport_auth_pass` | `***`
| `EMAIL_OPTIONS_from` | `fu@example.com`
| `EMAIL_OPTIONS_to` | `uta@example.com`


## Slave

| Name   | Example |  
|----------|-------------|
| `LOG_LEVEL` | [`LOG_LEVEL_NAME`](#LOG_LEVEL) |
| `DEFAULT_REFRESH_INTERVAL` | [`0 */5 * * * *`](#REFRESH_INTERVAL) |
| `ADDONS` | `./addon/pm2.js;./addon/cpu.js;./addon/memory.js;./addon/storage.js;./addon/mongodb.js;./addon/elastic-search.js` 
| `MONGODB_URIS` | `mongodb://localhost:27017/; |mongodb://localhost:27017/`
| `ELASTICSEARCH_URIS` | `http://localhost:9200;http://localhost:9200` |

## LOG_LEVEL

| LOG_LEVEL_NAME   | Description |  
|----------|-------------|  
| `fatal` | The service/app is going to stop or become unusable now. An operator should definitely look into this soon.
| `error` | Fatal for a particular request, but the service/app | continues servicing other requests. An operator should look at | this soon(ish).
| `warn` | A note on something that should probably be looked at by | an operator eventually.
| `info` | Detail on regular operation.
| `debug` | Anything else, i.e. too verbose to be included in info | level.
| `trace` | Logging from external libraries used by your app or very detailed application logging.

Setting a logger instance (or one of its streams) to a particular level implies that all log records at that level and above are logged. E.g. a logger set to level "info" will log records at level info and above (warn, error, fatal).

## INITIAL_DATA_SLOTS

```javascript
[
        {
                "computername":"server 1",
                "names":["MAIL", "SLACK", "API"]
        },
        {
                "computername":"server 1",
                "names":["CPU", "C:\"]
        }
]
```

## REFRESH_INTERVAL

### Cron expression examples

`0 */20 * * * *` // 20 minutes.  
`*/3 * * * * *`  // trhre seconds.  