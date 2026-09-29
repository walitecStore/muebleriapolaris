export const PAYMENT_METHODS = [
  { id: 'card', label: 'Tarjeta de crédito/débito', icon: '💳', provider: 'unconfigured' },
  { id: 'yape', label: 'Yape', icon: '📱', provider: 'manual' },
  { id: 'plin', label: 'Plin', icon: '📲', provider: 'manual' },
  { id: 'mercado_pago', label: 'Mercado Pago', icon: '🛡️', provider: 'unconfigured' },
  { id: 'bank_transfer', label: 'Transferencia bancaria', icon: '🏦', provider: 'manual' },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return PAYMENT_METHODS.some((method) => method.id === value);
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pago pendiente',
  approved: 'Pago aprobado',
  rejected: 'Pago rechazado',
  cancelled: 'Pago cancelado',
  failed: 'Error en el pago',
  pendiente: 'Pago pendiente',
  aprobado: 'Pago aprobado',
  rechazado: 'Pago rechazado',
  cancelado: 'Pago cancelado',
  fallido: 'Pago fallido',
};

export function paymentStatusLabel(status?: string | null) {
  return PAYMENT_STATUS_LABELS[status?.toLowerCase() || 'pending'] || 'Pago pendiente';
}

export function isPaymentApproved(status?: string | null) {
  return ['approved', 'aprobado'].includes(status?.toLowerCase() || '');
}
