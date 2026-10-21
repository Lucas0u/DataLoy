// Máscaras de dados no padrão brasileiro

export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

// 12345678900 -> 123.456.789-00 (formata enquanto digita)
export function maskCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// 75999998888 -> (75) 99999-8888 | 7532814455 -> (75) 3281-4455
export function maskPhone(value) {
  let digits = onlyDigits(value);

  // Número colado com o código do país: +55 75 99999-8888
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : "";
  }

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);

  // Celular (9 dígitos) usa 5 + 4; fixo (8 dígitos) usa 4 + 4
  const splitAt = number.length > 8 ? 5 : 4;

  if (number.length <= splitAt) {
    return `(${ddd}) ${number}`;
  }

  return `(${ddd}) ${number.slice(0, splitAt)}-${number.slice(splitAt)}`;
}

// Mesmo padrão aceito pelo backend: DDD (sem zero) + fixo de 8 ou celular 9 + 8
export function isValidPhone(value) {
  return /^[1-9]{2}(?:[2-8]\d{7}|9\d{8})$/.test(onlyDigits(value));
}

export function isValidCpfLength(value) {
  return onlyDigits(value).length === 11;
}
