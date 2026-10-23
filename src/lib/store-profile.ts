export const emptyStore = {
  name: 'Mueblería Polaris',
  description: '',
  logo_url: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  tax_id: '',
  hours: '',
  site_url: '',
  instagram_url: '',
  facebook_url: '',
  privacy_text: '',
  terms_text: '',
  shipping_text: '',
  returns_text: '',
  complaints_url: '',
  origin_lat: -11.993057,
  origin_lng: -77.071283,
  origin_address: 'Av. 12 de Octubre 1805, San Martín de Porres, Lima',
};
export type StoreProfile = typeof emptyStore;
export function whatsappLink(
  phone: string,
  message = 'Hola, quisiera información sobre sus productos.'
) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : null;
}
export function publicWebUrl(value: string) {
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
}
