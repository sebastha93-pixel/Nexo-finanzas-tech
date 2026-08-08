import { ParsedTransaction } from './bancolombia.parser';

function parseColombianAmount(raw: string): number {
  // Colombian format: '.' = thousands separator, ',' = decimal separator.
  // Do NOT blindly strip all dots — "$50.00" is 50, "$1.234" is 1234.
  let s = raw.trim().replace(/\s/g, '');
  if (s.includes(',')) {
    // Comma present → it's the decimal separator; dots are thousands.
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    const parts = s.split('.');
    const last = parts[parts.length - 1];
    // Strip dots only when they group thousands (3-digit trailing group,
    // or more than one dot). A single dot with a non-3-digit tail is a decimal.
    if (parts.length > 2 || (parts.length === 2 && last.length === 3)) {
      s = s.replace(/\./g, '');
    }
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// Declined / promotional / informational alerts must never become transactions.
function isNonTransactional(text: string): boolean {
  return /declinad|rechazad|no autoriz|fondos insuficientes|no pudimos|no se pudo|intento de|gana(?:te)?\s|premio|sorteo|felicidades|promoci|beneficio|gratis|descuento|puntos|c[oó]digo de seguridad|token/i.test(
    text,
  );
}

function cleanName(raw: string): string {
  return raw
    .replace(/[.,;:]+$/, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function parse(emailBody: string, subject: string): ParsedTransaction | null {
  const text = emailBody + ' ' + subject;

  // Ignore declined/promotional/security emails outright.
  if (isNonTransactional(text)) return null;

  // "Enviaste $X a NOMBRE" → expense
  const enviasteMatch = text.match(
    /[Ee]nviaste\s+\$?([\d.,]+)\s+a\s+([^\n\r.,]+)/,
  );
  if (enviasteMatch) {
    const amount = parseColombianAmount(enviasteMatch[1]);
    const recipient = cleanName(enviasteMatch[2]);
    return {
      amount,
      type: 'expense',
      description: `Enviaste a ${recipient} · Nequi`,
      category: 'Transferencias',
      date: new Date().toISOString(),
      merchant: recipient,
      rawText: text,
    };
  }

  // "Recibiste $X de NOMBRE" → income
  const recibisteMatch = text.match(
    /[Rr]ecibiste\s+\$?([\d.,]+)\s+de\s+([^\n\r.,]+)/,
  );
  if (recibisteMatch) {
    const amount = parseColombianAmount(recibisteMatch[1]);
    const sender = cleanName(recibisteMatch[2]);
    return {
      amount,
      type: 'income',
      description: `Recibiste de ${sender} · Nequi`,
      category: 'Transferencias',
      date: new Date().toISOString(),
      merchant: sender,
      rawText: text,
    };
  }

  // "Te llegaron $X" → income
  const llegaronMatch = text.match(/[Tt]e\s+llegaron\s+\$?([\d.,]+)/);
  if (llegaronMatch) {
    const amount = parseColombianAmount(llegaronMatch[1]);
    return {
      amount,
      type: 'income',
      description: 'Transferencia recibida · Nequi',
      category: 'Transferencias',
      date: new Date().toISOString(),
      rawText: text,
    };
  }

  // "Pagaste $X en MERCHANT" / "Compraste $X en MERCHANT" → expense
  const pagoMatch = text.match(
    /(?:[Pp]agaste|[Cc]ompraste)\s+\$?([\d.,]+)(?:\s+en\s+([^\n\r.,]+))?/,
  );
  if (pagoMatch) {
    const amount = parseColombianAmount(pagoMatch[1]);
    const merchant = pagoMatch[2] ? cleanName(pagoMatch[2]) : '';
    return {
      amount,
      type: 'expense',
      description: merchant ? `Pago en ${merchant} · Nequi` : 'Pago · Nequi',
      category: merchant ? 'Compras' : 'Otros',
      date: new Date().toISOString(),
      merchant: merchant || undefined,
      rawText: text,
    };
  }

  // "Retiraste $X" → expense
  const retiroMatch = text.match(/[Rr]etiraste\s+\$?([\d.,]+)/);
  if (retiroMatch) {
    const amount = parseColombianAmount(retiroMatch[1]);
    return {
      amount,
      type: 'expense',
      description: 'Retiro · Nequi',
      category: 'Efectivo',
      date: new Date().toISOString(),
      rawText: text,
    };
  }

  // Generic fallback — only when the email clearly describes a money movement.
  // Requiring an action verb prevents promos/balances ("¡Gana hasta $100.000!")
  // from being imported as phantom transactions.
  const hasActionVerb =
    /recib|llegaron|llegó|llego|abon|pagaste|compraste|enviaste|retiraste|transferiste|consignaci/i.test(
      text,
    );
  const genericMatch = text.match(/\$?([\d]{1,3}(?:\.\d{3})+(?:,\d{1,2})?)/);
  if (hasActionVerb && genericMatch && /nequi/i.test(text)) {
    const amount = parseColombianAmount(genericMatch[1]);
    if (amount > 0) {
      const isIncome = /recib|llegaron|llegó|llego|abon|consignaci/i.test(text);
      return {
        amount,
        type: isIncome ? 'income' : 'expense',
        description: subject.trim() || 'Transacción · Nequi',
        category: 'Transferencias',
        date: new Date().toISOString(),
        rawText: text,
      };
    }
  }

  return null;
}
