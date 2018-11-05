        "LOG_LEVEL": "info",
        "INITIAL_DATA_SLOTS": "[{computername:DESKTOP-GNESREK, names:[mongo-db,elastic-search-server]},{computername:evil-computer,names:[test-error,gugu]}]",
        "DEFAULT_REFRESH_INTERVAL": "0 */5 * * * *",
        "SLACK_REFRESH_INTERVAL": "0 */59 * * * *",
        "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/...",
         "TRANSPORT_ADDONS": "./transport/mail.js;./transport/slack.js",
        "EMAIL_REFRESH_INTERVAL": "0 */20 * * * *", // 20 minutes ; 3 seconds "*/3 * * * * *",
        "EMAIL_CONFIG_transport_service": "gmail",
        "EMAIL_CONFIG_transport_auth_user": "cardioscan.test@gmail.com",
        "EMAIL_CONFIG_transport_auth_pass": "cardioscan",
        "EMAIL_OPTIONS_from": "cardioscan.test@gmail.com",
        "EMAIL_OPTIONS_to": "stephan.ahlf@gmail.com"



               "DEFAULT_REFRESH_INTERVAL": "0 */5 * * * *",
        "ADDONS": "./addon/pm2.js;./addon/cpu.js;./addon/memory.js;./addon/storage.js;./addon/mongodb.js;./addon/elastic-search.js",
        /*  "ADDONS": "./addon/memory.js", */
        "MONGODB_URIS": "mongodb://localhost:27017/;mongodb://localhost:27017/",
        "ELASTICSEARCH_URIS": "http://localhost:9200;http://localhost:9200"