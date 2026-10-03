/**
 * Destination identifiers for each P2P rail we support.
 * These are what a counterparty must type into their bank/wallet app.
 */

import type { PaymentRail, UpeerCountryCode } from '@/lib/fiat/coverage';
import { marketForCurrency } from '@/lib/fiat/coverage';

export type RailDetailKey =
  | 'phone'
  | 'iban'
  | 'alias'
  | 'cbuCvu'
  | 'cvu'
  | 'bankName'
  | 'accountType'
  | 'accountNumber'
  | 'rut'
  | 'nationalId'
  | 'documentType'
  | 'documentNumber'
  | 'email'
  | 'wallet'
  | 'meetingPlace'
  | 'destination'
  | 'note';

export type PaymentDetails = Partial<Record<RailDetailKey, string>>;

export type RailFieldSpec = {
  key: RailDetailKey;
  label: string;
  hint: string;
  placeholder: string;
  required: boolean;
  inputMode?: 'tel' | 'numeric' | 'email' | 'text';
  maxLength?: number;
  options?: readonly { value: string; label: string }[];
};

const CL_ACCOUNT_TYPES = [
  { value: 'vista', label: 'Cuenta vista' },
  { value: 'corriente', label: 'Cuenta corriente' },
  { value: 'ahorro', label: 'Cuenta de ahorro' },
  { value: 'cuenta_rut', label: 'CuentaRUT' },
] as const;

const CO_ACCOUNT_TYPES = [
  { value: 'ahorros', label: 'Ahorros' },
  { value: 'corriente', label: 'Corriente' },
] as const;

const CO_DOC_TYPES = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ce', label: 'Cédula de extranjería' },
  { value: 'nit', label: 'NIT' },
  { value: 'ppt', label: 'PPT' },
] as const;

const CL_WALLETS = [
  { value: 'mach', label: 'MACH' },
  { value: 'tenpo', label: 'Tenpo' },
  { value: 'other', label: 'Other wallet' },
] as const;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function fieldsForRail(
  rail: PaymentRail,
  currency: string,
): RailFieldSpec[] {
  const country = marketForCurrency(currency)?.code;

  switch (rail) {
    case 'sinpe':
      return [
        {
          key: 'phone',
          label: 'SINPE Móvil number',
          hint: 'Costa Rican mobile linked to your colones account. 8 digits, no +506.',
          placeholder: '88888888',
          required: true,
          inputMode: 'numeric',
          maxLength: 8,
        },
      ];
    case 'bank_transfer':
      return bankTransferFields(country);
    case 'cvu_cbu':
      return [
        {
          key: 'alias',
          label: 'Alias',
          hint: '6–20 characters. Letters, numbers, period, or hyphen. This is enough for the payer.',
          placeholder: 'nombre.apellido.mp',
          required: false,
          maxLength: 20,
        },
        {
          key: 'cbuCvu',
          label: 'CBU or CVU',
          hint: '22 digits. Optional if you already shared an alias.',
          placeholder: '0000003100000000000000',
          required: false,
          inputMode: 'numeric',
          maxLength: 22,
        },
      ];
    case 'mercado_pago':
      return [
        {
          key: 'alias',
          label: 'Mercado Pago alias',
          hint: 'This is how the transfer reaches you. 6–20 characters; no ñ.',
          placeholder: 'nombre.apellido.mp',
          required: true,
          maxLength: 20,
        },
        {
          key: 'cvu',
          label: 'CVU (optional)',
          hint: '22-digit Clave Virtual Uniforme if you also want to show it.',
          placeholder: '0000003100000000000000',
          required: false,
          inputMode: 'numeric',
          maxLength: 22,
        },
      ];
    case 'nequi':
      return [
        {
          key: 'phone',
          label: 'Nequi mobile number',
          hint: 'Your Nequi is this Colombian mobile. 10 digits, starts with 3. No +57.',
          placeholder: '3001234567',
          required: true,
          inputMode: 'numeric',
          maxLength: 10,
        },
      ];
    case 'daviplata':
      return [
        {
          key: 'phone',
          label: 'Daviplata mobile number',
          hint: '10-digit Colombian mobile used as the electronic deposit number. No +57.',
          placeholder: '3001234567',
          required: true,
          inputMode: 'numeric',
          maxLength: 10,
        },
      ];
    case 'yape':
      return [
        {
          key: 'phone',
          label: 'Yape mobile number',
          hint: 'Bolivian mobile that is your Yape account. 8 digits, no +591.',
          placeholder: '70000000',
          required: true,
          inputMode: 'numeric',
          maxLength: 8,
        },
      ];
    case 'chile_wallet':
      return [
        {
          key: 'wallet',
          label: 'Wallet',
          hint: 'Payers usually send a transfer to MACH or Tenpo using your RUT.',
          placeholder: '',
          required: true,
          options: CL_WALLETS,
        },
        {
          key: 'rut',
          label: 'RUT',
          hint: 'Chilean tax ID. Banks match RUT with the destination account.',
          placeholder: '12.345.678-9',
          required: true,
          maxLength: 12,
        },
        {
          key: 'phone',
          label: 'Mobile (optional)',
          hint: 'Only if the wallet also accepts a phone as destination.',
          placeholder: '912345678',
          required: false,
          inputMode: 'tel',
          maxLength: 12,
        },
      ];
    case 'cash':
      return [
        {
          key: 'meetingPlace',
          label: 'How you meet',
          hint: 'City and a public place. Do not share your home address.',
          placeholder: 'San José, mall food court',
          required: true,
          maxLength: 200,
        },
      ];
    case 'other':
      return [
        {
          key: 'destination',
          label: 'How they pay you',
          hint: 'Exact identifier the payer must enter in their app.',
          placeholder: '',
          required: true,
          maxLength: 200,
        },
      ];
    default:
      return [];
  }
}

function bankTransferFields(country: UpeerCountryCode | undefined): RailFieldSpec[] {
  switch (country) {
    case 'CR':
      return [
        {
          key: 'iban',
          label: 'IBAN (SINPE)',
          hint: '22 characters starting with CR. This is the bank-account route, not SINPE Móvil.',
          placeholder: 'CR21001200000000000000',
          required: true,
          maxLength: 22,
        },
      ];
    case 'BO':
      return [
        {
          key: 'bankName',
          label: 'Bank',
          hint: 'Entity that holds the bolivianos account.',
          placeholder: 'Banco Nacional de Bolivia',
          required: true,
          maxLength: 80,
        },
        {
          key: 'accountNumber',
          label: 'Account number',
          hint: 'Number as shown in your bank app.',
          placeholder: '',
          required: true,
          inputMode: 'numeric',
          maxLength: 24,
        },
        {
          key: 'nationalId',
          label: 'Cédula de identidad',
          hint: 'Banks often require the holder CI to credit the account.',
          placeholder: '',
          required: true,
          maxLength: 20,
        },
      ];
    case 'CL':
      return [
        {
          key: 'bankName',
          label: 'Bank',
          hint: 'Destination bank in Chile.',
          placeholder: 'BancoEstado',
          required: true,
          maxLength: 80,
        },
        {
          key: 'accountType',
          label: 'Account type',
          hint: 'Must match the destination product (vista, corriente, ahorro, CuentaRUT).',
          placeholder: '',
          required: true,
          options: CL_ACCOUNT_TYPES,
        },
        {
          key: 'accountNumber',
          label: 'Account number',
          hint: 'For CuentaRUT this is usually the RUT without the check digit.',
          placeholder: '',
          required: true,
          inputMode: 'numeric',
          maxLength: 20,
        },
        {
          key: 'rut',
          label: 'RUT',
          hint: 'Required. Chilean banks match RUT + account + bank.',
          placeholder: '12.345.678-9',
          required: true,
          maxLength: 12,
        },
        {
          key: 'email',
          label: 'Email (optional)',
          hint: 'Some banks send a transfer notice here.',
          placeholder: 'you@email.com',
          required: false,
          inputMode: 'email',
          maxLength: 80,
        },
      ];
    case 'CO':
      return [
        {
          key: 'bankName',
          label: 'Bank',
          hint: 'Destination bank in Colombia (not Nequi/Daviplata).',
          placeholder: 'Bancolombia',
          required: true,
          maxLength: 80,
        },
        {
          key: 'accountType',
          label: 'Account type',
          hint: 'Ahorros or corriente.',
          placeholder: '',
          required: true,
          options: CO_ACCOUNT_TYPES,
        },
        {
          key: 'accountNumber',
          label: 'Account number',
          hint: 'As shown in your bank app.',
          placeholder: '',
          required: true,
          inputMode: 'numeric',
          maxLength: 20,
        },
        {
          key: 'documentType',
          label: 'Document type',
          hint: 'Payers enter this with the account number.',
          placeholder: '',
          required: true,
          options: CO_DOC_TYPES,
        },
        {
          key: 'documentNumber',
          label: 'Document number',
          hint: 'Cédula / NIT of the account holder.',
          placeholder: '',
          required: true,
          inputMode: 'numeric',
          maxLength: 18,
        },
      ];
    default:
      return [
        {
          key: 'bankName',
          label: 'Bank',
          hint: '',
          placeholder: '',
          required: true,
          maxLength: 80,
        },
        {
          key: 'accountNumber',
          label: 'Account number',
          hint: '',
          placeholder: '',
          required: true,
          maxLength: 24,
        },
      ];
  }
}

const ARG_ALIAS = /^[a-zA-Z0-9][a-zA-Z0-9.-]{5,19}$/;
const CR_IBAN = /^CR\d{20}$/i;
const CL_RUT = /^\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]$/;

export function validateRailDetails(
  rail: PaymentRail,
  currency: string,
  details: PaymentDetails,
  holderName: string,
): string | null {
  if (holderName.trim().length < 2) {
    return 'Add the account holder’s legal name so the payer can confirm the destination.';
  }

  const required = fieldsForRail(rail, currency).filter((f) => f.required);
  for (const field of required) {
    if (!details[field.key]?.trim()) {
      return `Add ${field.label.toLowerCase()}.`;
    }
  }

  if (rail === 'sinpe') {
    const phone = digitsOnly(details.phone ?? '');
    if (phone.length !== 8) {
      return 'SINPE Móvil is an 8-digit Costa Rican mobile number, not a nickname.';
    }
  }

  if (rail === 'nequi' || rail === 'daviplata') {
    const phone = digitsOnly(details.phone ?? '');
    if (phone.length !== 10 || !phone.startsWith('3')) {
      return 'Use a 10-digit Colombian mobile starting with 3, without +57.';
    }
  }

  if (rail === 'yape') {
    const phone = digitsOnly(details.phone ?? '');
    if (phone.length !== 8) {
      return 'Yape Bolivia uses an 8-digit Bolivian mobile number, not a name.';
    }
  }

  if (rail === 'bank_transfer' && marketForCurrency(currency)?.code === 'CR') {
    const iban = (details.iban ?? '').replace(/\s/g, '');
    if (!CR_IBAN.test(iban)) {
      return 'Costa Rica IBAN is 22 characters starting with CR (no spaces).';
    }
  }

  if (rail === 'cvu_cbu') {
    const alias = details.alias?.trim() ?? '';
    const cbu = digitsOnly(details.cbuCvu ?? '');
    if (!alias && !cbu) {
      return 'Add an alias (recommended) or a 22-digit CBU/CVU.';
    }
    if (alias && !ARG_ALIAS.test(alias)) {
      return 'Argentine alias is 6–20 characters: letters, numbers, period, or hyphen. No ñ.';
    }
    if (cbu && cbu.length !== 22) {
      return 'CBU/CVU must be exactly 22 digits.';
    }
  }

  if (rail === 'mercado_pago') {
    const alias = details.alias?.trim() ?? '';
    if (!ARG_ALIAS.test(alias)) {
      return 'Mercado Pago alias is 6–20 characters: letters, numbers, period, or hyphen. No ñ.';
    }
    const cvu = digitsOnly(details.cvu ?? '');
    if (details.cvu?.trim() && cvu.length !== 22) {
      return 'CVU must be exactly 22 digits if you include it.';
    }
  }

  if (
    (rail === 'bank_transfer' && marketForCurrency(currency)?.code === 'CL') ||
    rail === 'chile_wallet'
  ) {
    const rut = details.rut?.trim() ?? '';
    if (!CL_RUT.test(rut)) {
      return 'Enter a Chilean RUT (e.g. 12.345.678-9).';
    }
  }

  return null;
}

export function sanitizeDetails(
  rail: PaymentRail,
  currency: string,
  details: PaymentDetails,
): PaymentDetails {
  const allowed = new Set<RailDetailKey>([
    ...fieldsForRail(rail, currency).map((f) => f.key),
    'note',
  ]);
  const next: PaymentDetails = {};
  for (const [key, value] of Object.entries(details)) {
    if (!allowed.has(key as RailDetailKey)) {
      continue;
    }
    let v = value.trim();
    if (!v) {
      continue;
    }
    if (key === 'phone' || key === 'cbuCvu' || key === 'cvu' || key === 'accountNumber') {
      if (key === 'phone' || key === 'cbuCvu' || key === 'cvu') {
        v = digitsOnly(v);
      }
    }
    if (key === 'iban') {
      v = v.replace(/\s/g, '').toUpperCase();
    }
    if (key === 'alias') {
      v = v.toLowerCase();
    }
    next[key as RailDetailKey] = v;
  }
  return next;
}

export function emptyDetails(): PaymentDetails {
  return {};
}
