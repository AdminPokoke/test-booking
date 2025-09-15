import axios from 'axios';

export async function postToSlack(webhookUrl, text) {
  if (!webhookUrl) return;
  try {
    await axios.post(webhookUrl, { text });
  } catch (e) {
    console.error('Slack webhook error:', e.message);
  }
}
