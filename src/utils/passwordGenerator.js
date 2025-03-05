/**
 * Генерирует случайный пароль заданной длины
 * @param {number} length - Длина пароля (по умолчанию 10)
 * @param {boolean} includeUppercase - Включать ли заглавные буквы (по умолчанию true)
 * @param {boolean} includeNumbers - Включать ли цифры (по умолчанию true)
 * @param {boolean} includeSymbols - Включать ли специальные символы (по умолчанию false)
 * @returns {string} - Сгенерированный пароль
 */
export const generatePassword = (
  length = 10,
  includeUppercase = true,
  includeNumbers = true,
  includeSymbols = false
) => {
  // Наборы символов
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_-+=<>?';
  
  // Формируем набор символов для генерации пароля
  let chars = lowercaseChars;
  if (includeUppercase) chars += uppercaseChars;
  if (includeNumbers) chars += numberChars;
  if (includeSymbols) chars += symbolChars;
  
  // Генерируем пароль
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  // Проверяем, что пароль содержит хотя бы один символ из каждой выбранной категории
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = includeUppercase ? /[A-Z]/.test(password) : true;
  const hasNumber = includeNumbers ? /[0-9]/.test(password) : true;
  const hasSymbol = includeSymbols ? /[!@#$%^&*()_\-+=<>?]/.test(password) : true;
  
  // Если пароль не соответствует требованиям, генерируем новый
  if (!hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
    return generatePassword(length, includeUppercase, includeNumbers, includeSymbols);
  }
  
  return password;
};

/**
 * Проверяет надежность пароля
 * @param {string} password - Пароль для проверки
 * @returns {string} - Оценка надежности пароля ('weak', 'medium', 'strong')
 */
export const checkPasswordStrength = (password) => {
  if (!password) return 'weak';
  
  let strength = 0;
  
  // Длина пароля
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  
  // Наличие разных типов символов
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  
  // Оценка надежности
  if (strength < 3) return 'weak';
  if (strength < 5) return 'medium';
  return 'strong';
}; 