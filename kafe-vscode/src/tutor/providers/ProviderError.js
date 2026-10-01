const ERROR_MESSAGES = Object.freeze({
  missing_key: 'Configure a DeepSeek API key with KAFE: Configure Provider Key, then retry.',
  aborted: 'The tutor request was cancelled. Retry when ready.',
  timeout: 'The DeepSeek request timed out. Retry when ready.',
  auth: 'DeepSeek rejected the API key. Update it with KAFE: Configure Provider Key, then retry.',
  rate_limit: 'DeepSeek is rate limited. Retry when ready.',
  http: 'DeepSeek could not complete the request. Retry when ready.',
  transport: 'The tutor could not reach DeepSeek. Check your connection and retry.',
  malformed_response: 'DeepSeek returned an unusable response. Retry when ready.',
});

class ProviderError extends Error {
  constructor(code) {
    super(Object.hasOwn(ERROR_MESSAGES, code) ? ERROR_MESSAGES[code] : ERROR_MESSAGES.http);
    this.name = 'ProviderError';
    this.code = Object.hasOwn(ERROR_MESSAGES, code) ? code : 'http';
  }
}

module.exports = { ProviderError };
