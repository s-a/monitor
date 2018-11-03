const {
  IncomingWebhook
} = require('@slack/client');

function Slack() {
  const url = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';
  this.webhook = new IncomingWebhook(url);
  return this
}

Slack.prototype.send = async function (message) {
  if (message.details && message.details.valid_state && message.details.valid_state !== "success") {
    const symbols = {
      danger: ':hamburger:',
      warning: ':japanese_goblin:',
      success: ':feet:'
    }
    const symbol = symbols[message.details.valid_state] || ':feet:'
    // Send simple text to the webhook channel
    const result = await this.send({
      "text": symbol + " " + message.hostname + '/' + message.details.computername + '/' + message.details.name,
      "attachments": [{
        "text": message
      }]
    });
    return result
  }
}

module.exports = Slack