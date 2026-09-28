const MAX_EXPRESSION_LENGTH = 200;

export function evaluateExpression(source) {
  if (typeof source !== 'string' || source.trim() === '' || source.length > MAX_EXPRESSION_LENGTH) {
    throw new Error('Invalid expression');
  }

  const tokens = tokenize(source);
  let position = 0;

  function peek() {
    return tokens[position];
  }

  function take(value) {
    if (peek() === value) {
      position += 1;
      return true;
    }
    return false;
  }

  function parseExpression() {
    let value = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const operator = tokens[position++];
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  function parseTerm() {
    let value = parseUnary();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const operator = tokens[position++];
      const right = parseUnary();
      if ((operator === '/' || operator === '%') && right === 0) {
        throw new Error('Division by zero');
      }
      if (operator === '*') value *= right;
      if (operator === '/') value /= right;
      if (operator === '%') value %= right;
    }
    return value;
  }

  function parseUnary() {
    if (take('+')) return parseUnary();
    if (take('-')) return -parseUnary();
    return parsePrimary();
  }

  function parsePrimary() {
    if (take('(')) {
      const value = parseExpression();
      if (!take(')')) throw new Error('Invalid expression');
      return value;
    }

    const token = peek();
    if (!token || !/^\d+(?:\.\d+)?$/.test(token)) {
      throw new Error('Invalid expression');
    }
    position += 1;
    return Number(token);
  }

  const result = parseExpression();
  if (position !== tokens.length || !Number.isFinite(result)) {
    throw new Error('Invalid expression');
  }
  return Number(result.toFixed(10));
}

function tokenize(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const current = source[index];
    if (/\s/.test(current)) {
      index += 1;
      continue;
    }

    if (/[0-9]/.test(current)) {
      const match = source.slice(index).match(/^\d+(?:\.\d+)?/);
      tokens.push(match[0]);
      index += match[0].length;
      continue;
    }

    if ('+-*/%()'.includes(current)) {
      tokens.push(current);
      index += 1;
      continue;
    }

    throw new Error('Invalid expression');
  }

  return tokens;
}
