/**
 * Alice user emulation class.
 */

const fetch = require('node-fetch');
const merge = require('lodash.merge');

class User {
  constructor(webhookUrl, extraProps = {}) {
    this._webhookUrl = webhookUrl;
    this._extraProps = extraProps;
    this._index = ++User.counter;
    this._sessionsCount = 0;
    this._messagesCount = 0;
    this._reqBody = null;
    this._resBody = null;
  }

  get userId() {
    return `user-${this._index}`;
  }

  get sessionId() {
    return `session-${this._sessionsCount}`;
  }

  get response() {
    return this._resBody && this._resBody.response;
  }

  get body() {
    return this._resBody;
  }

  async enter(message = '', extraProps = {}) {
    this._sessionsCount++;
    this._messagesCount = 0;
    await this.say(message, extraProps);
  }

  async say(message, extraProps = {}) {
    if (this._messagesCount && !message && message !== 0) {
      throw new Error(`User must say something, got message: ${message}`);
    }
    this._resBody = null;
    this._messagesCount++;
    this._buildReqBody(message, extraProps);
    await this._sendRequest();
  }

  _buildReqBody(message, extraProps) {
    this._reqBody = merge({
      request: {
        command: message,
        original_utterance: message,
        type: 'SimpleUtterance',
      },
      session: {
        new: this._messagesCount === 1,
        user_id: this.userId,
        session_id: this.sessionId,
        message_id: this._messagesCount,
        skill_id: 'test-skill',
      },
      meta: {
        locale: 'ru-RU',
        timezone: 'Europe/Moscow',
        client_id: 'ru.yandex.searchplugin/5.80 (Samsung Galaxy; Android 4.4)',
        interfaces: {
          screen: {}
        }
      },
      version: '1.0'
    }, this._extraProps, extraProps);
  }

  async _sendRequest() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    const response = await fetch(this._webhookUrl, {
      method: 'post',
      headers,
      body: JSON.stringify(this._reqBody),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    this._resBody = await response.json();
  }
}

User.counter = 0;

module.exports = User;